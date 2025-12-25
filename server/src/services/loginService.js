const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const logModel = require("../models/logModel");
const appConfig = require("../config/app");

const loginService = {
  // TAHAP 1: Cek Password & Tentukan Nasib
  initiate: async (email, password, ipAddress) => {
    const normalizedEmail = email.toLowerCase();

    // 1. Ambil data sensitif
    const user = await userModel.findForLogin(normalizedEmail);
    const invalidMsg = "Email atau Password salah!";

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
    if (!user.isVerified) throw new Error("Akun belum diverifikasi.");
    if (user.isActive === false) throw new Error("Akun dinonaktifkan.");

    // 4. LOGIKA STATE MACHINE (MFA CHECK)
    // Contoh: Admin WAJIB MFA. User biasa lolos.
    const needsMfa = user.role === "ADMIN";

    if (needsMfa) {
      // --> Masuk Ruang Tunggu (Pre-Auth)
      const preAuthToken = jwt.sign(
        { id: user.id, role: "PRE_AUTH", step: "MFA" },
        appConfig.jwt.secret,
        { expiresIn: "5m" } // Token ini cuma hidup 5 menit
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
      { expiresIn: appConfig.jwt.expiresIn }
    );

    await logModel.create({
      action: "AUTH_LOGIN",
      userId: user.id,
      details: "Login success",
      ipAddress,
    });

    // Bersihkan password sebelum dikirim ke controller
    delete user.password;

    return { status: "SUCCESS", token, user };
  },

  // TAHAP 2: Verifikasi Kode (Jika kena MFA)
  verifyMfa: async (preAuthToken, mfaCode, ipAddress) => {
    let decoded;
    try {
      decoded = jwt.verify(preAuthToken, appConfig.jwt.secret);
    } catch (e) {
      throw new Error("Sesi login kadaluwarsa.");
    }

    if (decoded.role !== "PRE_AUTH") throw new Error("Token tidak valid.");

    const user = await userModel.findById(decoded.id);
    if (!user) throw new Error("User tidak ditemukan.");

    // [TODO] Ganti logika "123456" dengan TOTP Real nanti
    if (mfaCode !== "123456") throw new Error("Kode Salah.");

    // Terbitkan Token Asli
    const token = jwt.sign(
      { id: user.id, role: user.role, status: "FULL" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.expiresIn }
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
