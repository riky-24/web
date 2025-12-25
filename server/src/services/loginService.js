const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const logModel = require("../models/logModel");
const appConfig = require("../config/app");
// [BARU] Import Konstanta
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

    // 1. Ambil data sensitif
    const user = await userModel.findForLogin(normalizedEmail);
    // [FIX] Gunakan Pesan Baku dari Config
    const invalidMsg = MESSAGES.AUTH.INVALID_CREDENTIALS;

    // 2. Cek Password (Anti-Timing Attack)
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

    // 4. LOGIKA STATE MACHINE
    // [FIX] Gunakan Role Baku dari Config
    const needsMfa = user.role === ROLES.ADMIN;

    if (needsMfa) {
      // --> Masuk Ruang Tunggu (Pre-Auth)
      const preAuthToken = jwt.sign(
        {
          id: user.id,
          role: TOKEN_TYPES.PRE_AUTH,
          step: AUTH_STEPS.MFA_VERIFICATION,
        },
        appConfig.jwt.secret,
        { expiresIn: appConfig.jwt.preAuthExpiresIn } // [FIX] Ambil durasi dari Config
      );

      await logModel.create({
        action: "AUTH_CHALLENGE",
        userId: user.id,
        details: "MFA Required",
        ipAddress,
      });

      return { status: "MFA_REQUIRED", preAuthToken };
    }

    // --> Lolos Langsung
    const token = jwt.sign(
      { id: user.id, role: user.role, status: "FULL" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.accessExpiresIn } // [FIX] Ambil durasi dari Config
    );

    await logModel.create({
      action: "AUTH_LOGIN",
      userId: user.id,
      details: "Login success",
      ipAddress,
    });

    delete user.password;
    return { status: "SUCCESS", token, user };
  },

  // TAHAP 2: Verifikasi Kode
  verifyMfa: async (preAuthToken, mfaCode, ipAddress) => {
    let decoded;
    try {
      decoded = jwt.verify(preAuthToken, appConfig.jwt.secret);
    } catch (e) {
      throw new Error("Sesi login kadaluwarsa.");
    }

    // [FIX] Cek Tipe Token pakai Config
    if (decoded.role !== TOKEN_TYPES.PRE_AUTH)
      throw new Error("Token tidak valid.");

    const user = await userModel.findById(decoded.id);
    if (!user) throw new Error("User tidak ditemukan.");

    // [TODO] Nanti ganti TOTP Real
    if (mfaCode !== "123456") throw new Error("Kode Salah.");

    const token = jwt.sign(
      { id: user.id, role: user.role, status: "FULL" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.accessExpiresIn } // [FIX] Ambil durasi dari Config
    );

    await logModel.create({
      action: "AUTH_MFA_SUCCESS",
      userId: user.id,
      details: "MFA Verified",
      ipAddress,
    });

    return { token, user };
  },
};

module.exports = loginService;
