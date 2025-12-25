const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const adminModel = require("../models/adminModel");
const logModel = require("../models/logModel");
const appConfig = require("../config/app");
const { TOKEN_TYPES, MESSAGES } = require("../config/constants");

const adminAuthService = {
  /**
   * TAHAP 1: Validasi Kredensial (Email & Password)
   */
  initiateLogin: async (email, password, ipAddress) => {
    const normalizedEmail = email.toLowerCase();
    const admin = await adminModel.findAdminForLogin(normalizedEmail);
    const invalidMsg = "Email atau Password Admin salah.";

    // 1. Cek keberadaan admin & Password
    if (!admin) {
      // Teknik mitigasi timing attack
      await bcrypt.compare(
        password || "dummy",
        "$2b$10$abcdefghijklmnopqrstuv"
      );
      throw new Error(invalidMsg);
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new Error(invalidMsg);

    // 2. Cek status aktif akun
    if (admin.isActive === false) throw new Error("Akses Admin diblokir.");

    // 3. Logika MFA Wajib untuk Admin
    if (admin.mfaSecret) {
      // Buat token sementara (Pre-Auth) untuk masuk ke halaman OTP
      const preAuthToken = jwt.sign(
        { id: admin.id, role: TOKEN_TYPES.PRE_AUTH },
        appConfig.jwt.secret,
        { expiresIn: appConfig.jwt.preAuthExpiresIn }
      );

      await logModel.create({
        action: "ADMIN_LOGIN_CHALLENGE",
        userId: admin.id,
        details: "Menunggu Verifikasi MFA",
        ipAddress,
      });

      return { status: "MFA_REQUIRED", preAuthToken };
    }

    throw new Error("Konfigurasi MFA tidak ditemukan. Hubungi IT Lead.");
  },

  /**
   * TAHAP 2: Verifikasi Kode OTP (TOTP)
   */
  verifyAdminMfa: async (preAuthToken, otpCode, ipAddress) => {
    let decoded;
    try {
      decoded = jwt.verify(preAuthToken, appConfig.jwt.secret);
    } catch (e) {
      throw new Error("Sesi verifikasi kadaluwarsa.");
    }

    const admin = await adminModel.findAdminById(decoded.id);
    if (!admin || !admin.mfaSecret) throw new Error("Akses ditolak.");

    // Verifikasi kode dari Google Authenticator / sejenisnya
    const isValid = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: "base32",
      token: otpCode,
      window: 1, // toleransi 30 detik
    });

    if (!isValid) {
      await logModel.create({
        action: "ADMIN_MFA_FAILED",
        userId: admin.id,
        details: "Kode OTP Salah",
        ipAddress,
        level: "warn",
      });
      throw new Error("Kode OTP tidak valid.");
    }

    // Login Sukses: Buat Token Akses Full
    const token = jwt.sign(
      { id: admin.id, role: "ADMIN", status: "FULL_ACCESS" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.accessExpiresIn }
    );

    await logModel.create({
      action: "ADMIN_LOGIN_SUCCESS",
      userId: admin.id,
      details: "Login Admin Berhasil via MFA",
      ipAddress,
    });

    return {
      token,
      admin: { id: admin.id, email: admin.email, username: admin.username },
    };
  },
};

module.exports = adminAuthService;
