const { prisma } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/emailService");

// Ambil secret dari env atau fallback (sama seperti di authMiddleware)
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

const authController = {
  // ==========================================
  // 1. REGISTER
  // ==========================================
  register: async (req, res) => {
    let newUser = null;

    try {
      // Input sudah AMAN karena sudah dicek oleh Middleware
      // Email juga sudah di-lowercase oleh middleware
      const { name, email, password } = req.body;

      // --- 1. Pre-Computation (Mitigasi Timing Attack) ---
      // Hash password dilakukan selalu, agar durasi request konsisten
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // --- 2. Cek Email Terdaftar (Silent Check) ---
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Return sukses palsu (Anti-Enumeration)
        return res.status(200).json({
          status: "success",
          message: "Registrasi berhasil! Cek email Anda untuk verifikasi akun.",
        });
      }

      // --- 3. Persiapan Data ---
      let username =
        email.split("@")[0] + Math.floor(1000 + Math.random() * 9000);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // --- 4. SIMPAN KE DB ---
      newUser = await prisma.user.create({
        data: {
          name,
          email,
          username,
          password: hashedPassword,
          role: "USER",
          balance: 0,
          isVerified: false,
          verificationToken: verificationToken,
        },
      });

      // --- 5. KIRIM EMAIL ---
      const emailSent = await emailService.sendVerificationEmail(
        newUser.email,
        verificationToken
      );

      if (!emailSent) {
        // Rollback jika email gagal kirim
        await prisma.user.delete({ where: { id: newUser.id } });
        return res.status(500).json({
          message: "Gagal mengirim email verifikasi. Silakan coba lagi.",
        });
      }

      // --- 6. Audit Log ---
      await prisma.auditLog.create({
        data: {
          action: "AUTH_REGISTER",
          userId: newUser.id,
          details: "User register success",
          ipAddress: req.ip || req.socket.remoteAddress,
        },
      });

      res.status(201).json({
        status: "success",
        message: "Registrasi berhasil! Cek email Anda untuk verifikasi akun.",
      });
    } catch (error) {
      console.error("Register Error:", error);
      // Rollback safety net
      if (newUser) {
        try {
          await prisma.user.delete({ where: { id: newUser.id } });
        } catch (cleanupError) {
          console.error("Cleanup Error:", cleanupError);
        }
      }
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },

  // ==========================================
  // 2. LOGIN
  // ==========================================
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email ? email.toLowerCase() : "";

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      const invalidMsg = "Email atau Password salah!";

      // --- Mitigasi Timing Attack ---
      if (!user) {
        await bcrypt.compare(
          password || "dummy",
          "$2b$10$abcdefghijklmnopqrstuv"
        );
        return res.status(400).json({ message: invalidMsg });
      }

      // Cek Lockout
      if (user.lockUntil && user.lockUntil > new Date()) {
        const timeLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
        return res.status(403).json({
          message: `Akun terkunci. Coba lagi dalam ${timeLeft} menit.`,
        });
      }

      // Cek Password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        // Logic Counter Gagal Login
        const MAX_ATTEMPTS = 5;
        const LOCK_TIME = 30 * 60 * 1000;
        let newAttempts = (user.failedLoginAttempts || 0) + 1;
        let newLockUntil = user.lockUntil;

        if (newAttempts >= MAX_ATTEMPTS) {
          newLockUntil = new Date(Date.now() + LOCK_TIME);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: newAttempts, lockUntil: newLockUntil },
        });

        return res.status(400).json({ message: invalidMsg });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          message: "Akun belum diverifikasi. Silakan cek email Anda.",
          needVerification: true,
        });
      }

      if (user.isActive === false) {
        return res.status(403).json({ message: "Akun dinonaktifkan." });
      }

      // Reset Lockout & Sukses
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockUntil: null },
      });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "1d",
      });

      await prisma.auditLog.create({
        data: {
          action: "AUTH_LOGIN",
          userId: user.id,
          details: "Login success",
          ipAddress: req.ip || req.socket.remoteAddress,
        },
      });

      res.json({
        status: "success",
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            balance: user.balance,
          },
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Gagal login." });
    }
  },

  // ==========================================
  // 3. VERIFY EMAIL
  // ==========================================
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.body;
      if (!token)
        return res.status(400).json({ message: "Token tidak valid." });

      const user = await prisma.user.findUnique({
        where: { verificationToken: token },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Link verifikasi tidak valid/kedaluwarsa." });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, verificationToken: null },
      });

      await prisma.auditLog.create({
        data: {
          action: "AUTH_VERIFY",
          userId: user.id,
          details: "Email verified",
          ipAddress: req.ip || req.socket.remoteAddress,
        },
      });

      res.json({
        status: "success",
        message: "Email berhasil diverifikasi! Silakan login.",
      });
    } catch (error) {
      console.error("Verify Error:", error);
      res.status(500).json({ message: "Gagal verifikasi email." });
    }
  },

  // ==========================================
  // 4. FORGOT PASSWORD
  // ==========================================
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email ? email.toLowerCase() : "";

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return res.status(200).json({
          message: "Link reset password telah dikirim ke email Anda.",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 3600000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpires,
        },
      });

      await emailService.sendResetPasswordEmail(user.email, resetToken);

      res.json({ message: "Link reset password telah dikirim ke email Anda." });
    } catch (error) {
      console.error("Forgot Pass Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },

  // ==========================================
  // 5. RESET PASSWORD
  // ==========================================
  resetPassword: async (req, res) => {
    try {
      // Validasi input sudah di-handle Middleware
      const { token, newPassword } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { gt: new Date() },
        },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Token tidak valid atau sudah kedaluwarsa." });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "AUTH_RESET_PASSWORD",
          userId: user.id,
          details: "Password reset success",
          ipAddress: req.ip || req.socket.remoteAddress,
        },
      });

      res.json({
        status: "success",
        message:
          "Password berhasil diubah! Silakan login dengan password baru.",
      });
    } catch (error) {
      console.error("Reset Pass Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },
};

module.exports = authController;
