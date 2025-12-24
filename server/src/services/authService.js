const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userModel = require("../models/userModel");
const logModel = require("../models/logModel");
const emailService = require("./emailService");
const appConfig = require("../config/app");

const authService = {
  register: async (payload) => {
    const { name, email, password, ipAddress } = payload;

    // 1. Cek User via Model
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) return { success: true }; // Silent return (Anti-Enumeration)

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generate Data
    const username =
      email.split("@")[0] + Math.floor(1000 + Math.random() * 9000);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 4. Simpan User via Model
    const newUser = await userModel.create({
      name,
      email,
      username,
      password: hashedPassword,
      role: "USER",
      balance: 0,
      isVerified: false,
      verificationToken,
    });

    // 5. Kirim Email
    const emailSent = await emailService.sendVerificationEmail(
      newUser.email,
      verificationToken
    );

    if (!emailSent) {
      await userModel.delete(newUser.id); // Rollback
      throw new Error("Gagal mengirim email verifikasi");
    }

    // 6. Log Aktivitas
    await logModel.create({
      action: "AUTH_REGISTER",
      userId: newUser.id,
      details: "User register success",
      ipAddress,
    });

    return { success: true };
  },

  login: async (payload) => {
    const { email, password, ipAddress } = payload;
    const normalizedEmail = email.toLowerCase();

    const user = await userModel.findByEmail(normalizedEmail);
    const invalidMsg = "Email atau Password salah!";

    // Anti-Timing Attack (Dummy Check)
    if (!user) {
      await bcrypt.compare(
        password || "dummy",
        "$2b$10$abcdefghijklmnopqrstuv"
      );
      throw new Error(invalidMsg);
    }

    // Cek Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Logic Lockout sederhana bisa ditambahkan di sini via userModel.update
      throw new Error(invalidMsg);
    }

    if (!user.isVerified)
      throw new Error("Akun belum diverifikasi. Cek email Anda.");
    if (user.isActive === false) throw new Error("Akun dinonaktifkan.");

    // Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.expiresIn }
    );

    await logModel.create({
      action: "AUTH_LOGIN",
      userId: user.id,
      details: "Login success",
      ipAddress,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        balance: user.balance,
      },
    };
  },

  verifyEmail: async (token) => {
    const user = await userModel.findByVerificationToken(token);
    if (!user) throw new Error("Token tidak valid.");

    await userModel.update(user.id, {
      isVerified: true,
      verificationToken: null,
    });

    await logModel.create({
      action: "AUTH_VERIFY",
      userId: user.id,
      details: "Email verified",
    });

    return true;
  },

  forgotPassword: async (email) => {
    const user = await userModel.findByEmail(email);
    if (!user) return true; // Silent success

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 Jam

    await userModel.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    });

    await emailService.sendResetPasswordEmail(user.email, resetToken);
    return true;
  },

  resetPassword: async (token, newPassword) => {
    const user = await userModel.findByResetToken(token);
    if (!user) throw new Error("Token tidak valid atau kadaluwarsa.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userModel.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    await logModel.create({
      action: "AUTH_RESET",
      userId: user.id,
      details: "Password reset success",
    });

    return true;
  },
};

module.exports = authService;
