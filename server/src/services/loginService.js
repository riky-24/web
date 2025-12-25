const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy"); // [BARU] Library TOTP Real
const userModel = require("../models/userModel");
const logModel = require("../models/logModel");
const appConfig = require("../config/app");
const {
  ROLES,
  AUTH_STEPS,
  TOKEN_TYPES,
  MESSAGES,
} = require("../config/constants");

const loginService = {
  // TAHAP 1: Cek Password & Tentukan Nasib
  initiate: async (email, password, ipAddress) => {
    const normalizedEmail = email.toLowerCase();

    // 1. Ambil Data
    const user = await userModel.findForLogin(normalizedEmail);
    const invalidMsg = MESSAGES.AUTH.INVALID_CREDENTIALS;

    // 2. Cek Password
    if (!user) {
      await bcrypt.compare(
        password || "dummy",
        "$2b$10$abcdefghijklmnopqrstuv"
      );
      throw new Error(invalidMsg);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error(invalidMsg);

    // 3. Validasi Akun
    if (!user.isVerified) throw new Error(MESSAGES.AUTH.UNVERIFIED);
    if (user.isActive === false) throw new Error(MESSAGES.AUTH.ACCOUNT_LOCKED);

    // 4. LOGIKA REAL MFA (Bukan cuma cek Role)
    // MFA Wajib jika: (User adalah Admin) ATAU (User emang mengaktifkan MFA)
    const isAdmin = user.role === ROLES.ADMIN;
    const isMfaActive = user.isMfaActive; // Dari DB

    // Logic: Admin WAJIB MFA. User biasa OPSIONAL (tergantung settingan dia).
    // Tapi user harus punya 'mfaSecret' di DB dulu.
    const needsMfa = (isAdmin || isMfaActive) && user.mfaSecret;

    if (needsMfa) {
      // --> Masuk Ruang Tunggu (Pre-Auth)
      const preAuthToken = jwt.sign(
        {
          id: user.id,
          role: TOKEN_TYPES.PRE_AUTH,
          step: AUTH_STEPS.MFA_VERIFICATION,
        },
        appConfig.jwt.secret,
        { expiresIn: appConfig.jwt.preAuthExpiresIn }
      );

      await logModel.create({
        action: "AUTH_CHALLENGE",
        userId: user.id,
        details: "Real MFA Challenge",
        ipAddress,
      });

      return { status: "MFA_REQUIRED", preAuthToken };
    }

    // --> Lolos Langsung
    const token = jwt.sign(
      { id: user.id, role: user.role, status: "FULL" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.accessExpiresIn }
    );

    await logModel.create({
      action: "AUTH_LOGIN",
      userId: user.id,
      details: "Login success",
      ipAddress,
    });

    // Hapus data sensitif
    delete user.password;
    delete user.mfaSecret;

    return { status: "SUCCESS", token, user };
  },

  // TAHAP 2: Verifikasi Kode (REAL TIME CHECK)
  verifyMfa: async (preAuthToken, mfaCode, ipAddress) => {
    let decoded;
    try {
      decoded = jwt.verify(preAuthToken, appConfig.jwt.secret);
    } catch (e) {
      throw new Error("Sesi login kadaluwarsa. Silakan login ulang.");
    }

    if (decoded.role !== TOKEN_TYPES.PRE_AUTH)
      throw new Error("Token tidak valid.");

    const user = await userModel.findById(decoded.id);
    if (!user) throw new Error("User tidak ditemukan.");
    if (!user.mfaSecret)
      throw new Error("Akun ini tidak memiliki konfigurasi MFA.");

    // [REAL] Verifikasi Kode menggunakan Speakeasy
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32", // Standar Google Auth
      token: mfaCode,
      window: 1, // Toleransi waktu +/- 30 detik (biar gak strict banget)
    });

    if (!isValid) {
      await logModel.create({
        action: "AUTH_MFA_FAIL",
        userId: user.id,
        details: "Wrong OTP Code",
        ipAddress,
        level: "warn",
      });
      throw new Error("Kode Authenticator salah.");
    }

    // Lolos Verifikasi
    const token = jwt.sign(
      { id: user.id, role: user.role, status: "FULL" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.accessExpiresIn }
    );

    await logModel.create({
      action: "AUTH_MFA_SUCCESS",
      userId: user.id,
      details: "Real MFA Verified",
      ipAddress,
    });

    // Bersihkan secret sebelum return
    delete user.mfaSecret;

    return { token, user };
  },
};

module.exports = loginService;
