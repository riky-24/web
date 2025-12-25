const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const crypto = require("crypto"); // [BARU] Wajib ada untuk generate token random
const adminModel = require("../models/adminModel");
const logModel = require("../models/logModel");
const emailService = require("../utils/emailService"); // [BARU] Import Email Service
const appConfig = require("../config/app");
const { TOKEN_TYPES } = require("../config/constants");

const adminAuthService = {
  /**
   * TAHAP 1: Inisiasi Login Admin (Verifikasi Password + Anti Brute Force DB)
   */
  initiate: async (email, password, ipAddress) => {
    const normalizedEmail = email.toLowerCase();
    const admin = await adminModel.findAdminForLogin(normalizedEmail);

    const authError = "Kredensial Admin tidak valid.";

    if (!admin) {
      await bcrypt.compare(password || "dummy", "$2b$10$dummyhashstandard");
      throw new Error(authError);
    }

    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((admin.lockUntil - new Date()) / 60000);
      throw new Error(
        `Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${minutesLeft} menit.`
      );
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      await adminModel.incrementLoginAttempts(
        admin.id,
        admin.failedLoginAttempts
      );

      if (admin.failedLoginAttempts + 1 >= 5) {
        await adminModel.lockAccount(admin.id);
        await logModel.create({
          action: "ACCOUNT_LOCKED",
          userId: admin.id,
          details: "Akun dikunci otomatis (5x Salah Password)",
          ipAddress,
          level: "critical",
        });
        throw new Error(
          "Terlalu banyak percobaan gagal. Akun dikunci 30 menit."
        );
      }
      throw new Error(authError);
    }

    if (admin.failedLoginAttempts > 0 || admin.lockUntil) {
      await adminModel.resetLoginAttempts(admin.id);
    }

    if (admin.isActive === false) throw new Error("Akun admin dinonaktifkan.");
    if (!admin.mfaSecret)
      throw new Error("Konfigurasi keamanan MFA tidak ditemukan.");

    const preAuthToken = jwt.sign(
      { id: admin.id, role: TOKEN_TYPES.PRE_AUTH, type: "ADMIN_LOGIN" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.preAuthExpiresIn }
    );

    await logModel.create({
      action: "ADMIN_AUTH_CHALLENGE",
      userId: admin.id,
      details: "Password OK, Menunggu OTP",
      ipAddress,
    });

    return { status: "MFA_REQUIRED", preAuthToken };
  },

  /**
   * TAHAP 2: Verifikasi Real-Time OTP Admin
   */
  verifyMfa: async (preAuthToken, otpCode, ipAddress) => {
    let decoded;
    try {
      decoded = jwt.verify(preAuthToken, appConfig.jwt.secret);
    } catch (e) {
      throw new Error("Sesi login admin kadaluwarsa.");
    }

    if (decoded.role !== TOKEN_TYPES.PRE_AUTH) throw new Error("Akses Ilegal.");

    const admin = await adminModel.findAdminById(decoded.id);
    if (!admin) throw new Error("Admin tidak ditemukan.");

    const adminSecure = await adminModel.findAdminForLogin(admin.email);

    if (adminSecure.lockUntil && adminSecure.lockUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (adminSecure.lockUntil - new Date()) / 60000
      );
      throw new Error(`Akun terkunci. Tunggu ${minutesLeft} menit.`);
    }

    const isValid = speakeasy.totp.verify({
      secret: adminSecure.mfaSecret,
      encoding: "base32",
      token: otpCode,
      window: 1,
    });

    if (!isValid) {
      await adminModel.incrementLoginAttempts(
        adminSecure.id,
        adminSecure.failedLoginAttempts
      );

      if (adminSecure.failedLoginAttempts + 1 >= 3) {
        await adminModel.lockAccount(adminSecure.id);
        await logModel.create({
          action: "ACCOUNT_LOCKED_MFA",
          userId: adminSecure.id,
          details: "Akun dikunci otomatis (3x Salah OTP)",
          ipAddress,
          level: "critical",
        });
        throw new Error("OTP Salah 3x. Akun dikunci otomatis demi keamanan.");
      }

      await logModel.create({
        action: "ADMIN_MFA_FAIL",
        userId: adminSecure.id,
        details: "Kode OTP Salah",
        ipAddress,
        level: "warn",
      });
      throw new Error("Kode OTP tidak valid.");
    }

    if (adminSecure.failedLoginAttempts > 0 || adminSecure.lockUntil) {
      await adminModel.resetLoginAttempts(adminSecure.id);
    }

    const accessToken = jwt.sign(
      { id: adminSecure.id, role: "ADMIN", status: "FULL" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.accessExpiresIn }
    );

    await logModel.create({
      action: "ADMIN_LOGIN_SUCCESS",
      userId: adminSecure.id,
      details: "Admin berhasil masuk sistem (MFA Verified)",
      ipAddress,
    });

    return {
      accessToken,
      admin: {
        id: adminSecure.id,
        username: adminSecure.username,
        email: adminSecure.email,
      },
    };
  },

  /**
   * [BARU] STEP 1: Request Lupa Password (Mengisi Kekosongan Logic)
   */
  requestPasswordReset: async (email) => {
    // Cari admin, tapi jangan error jika tidak ketemu (Security)
    const admin = await adminModel.findAdminForLogin(email);

    if (!admin) {
      console.log(`[SEC] Reset request ke email non-exist: ${email}`);
      return; // Silent return
    }

    // 1. Buat Token Random 32 Bytes
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Set Expired 15 Menit
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // 3. Simpan ke Database
    await adminModel.saveResetToken(admin.id, resetToken, tokenExpiry);

    // 4. Kirim Email (Pastikan SMTP sudah diset di .env)
    await emailService.sendResetEmail(admin.email, resetToken);
  },

  /**
   * [BARU] STEP 2: Eksekusi Reset Password
   */
  resetPassword: async (token, newPassword) => {
    // 1. Cari user dengan token valid
    const admin = await adminModel.findAdminByResetToken(token);

    if (!admin) {
      throw new Error("Token tidak valid atau sudah kadaluwarsa.");
    }

    // 2. Hash Password Baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update DB & Hapus Token
    await adminModel.updatePasswordAndClearToken(admin.id, hashedPassword);

    // 4. Log Aktivitas
    await logModel.create({
      action: "PASSWORD_RESET",
      userId: admin.id,
      details: "Password berhasil direset via email.",
      ipAddress: "System",
    });

    return true;
  },
};

module.exports = adminAuthService;
