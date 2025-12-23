const { prisma } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/emailService");

const authController = {
  // ==========================================
  // 1. REGISTER (Updated: Anti-Zombie Account)
  // ==========================================
  register: async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      // --- VALIDASI INPUT ---
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Semua kolom wajib diisi!" });
      }

      // Validasi XSS (Nama tidak boleh ada simbol aneh)
      if (/[<>;]/.test(name)) {
        return res
          .status(400)
          .json({ message: "Nama mengandung karakter terlarang!" });
      }

      // Validasi Password Strength
      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password minimal 8 karakter!" });
      }

      const commonPasswords = [
        "12345678",
        "password",
        "qwertyui",
        "rahasia",
        "admin123",
      ];
      if (commonPasswords.includes(password.toLowerCase())) {
        return res
          .status(400)
          .json({ message: "Password terlalu umum, gunakan yang lebih kuat!" });
      }

      // Cek Email Terdaftar
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Registrasi gagal. Cek kembali data Anda." });
      }

      // --- PROSES PEMBUATAN AKUN ---

      // 1. Generate Username Unik
      let username =
        email.split("@")[0] + Math.floor(1000 + Math.random() * 9000);

      // 2. Hash Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 3. Generate Token Verifikasi
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // 4. Simpan ke Database (Status: Belum Verifikasi)
      const newUser = await prisma.user.create({
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

      // 5. KIRIM EMAIL (DENGAN PENGECEKAN)
      const emailSent = await emailService.sendVerificationEmail(
        newUser.email,
        verificationToken
      );

      // --- LOGIC ANTI-ZOMBIE ACCOUNT ---
      // Jika email gagal dikirim (SMTP Error), hapus user yang baru dibuat.
      // Supaya user bisa mencoba daftar lagi dan tidak nyangkut.
      if (!emailSent) {
        await prisma.user.delete({ where: { id: newUser.id } });
        return res
          .status(500)
          .json({
            message:
              "Gagal mengirim email verifikasi. Silakan coba lagi nanti.",
          });
      }
      // ----------------------------------

      // 6. Audit Log
      await prisma.auditLog.create({
        data: {
          action: "AUTH_REGISTER",
          userId: newUser.id,
          details: "User register",
          ipAddress: req.ip,
        },
      });

      res.status(201).json({
        status: "success",
        message:
          "Registrasi berhasil! Silakan cek email Anda untuk verifikasi.",
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },

  // ==========================================
  // 2. VERIFIKASI EMAIL
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
          .json({ message: "Link verifikasi tidak valid atau kedaluwarsa." });
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
          ipAddress: req.ip,
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
  // 3. LOGIN (Full Security: Lockout & Verify)
  // ==========================================
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      // Dummy Hash (Anti-Timing Attack)
      if (!user) {
        await bcrypt.compare(password, "$2b$10$abcdefghijklmnopqrstuv");
        return res.status(400).json({ message: "Email atau Password salah!" });
      }

      // Cek Lockout
      if (user.lockUntil && user.lockUntil > new Date()) {
        const timeLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
        return res
          .status(403)
          .json({
            message: `Akun terkunci. Coba lagi dalam ${timeLeft} menit.`,
          });
      }

      // Cek Password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        // Logic Lockout Counter
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

        return res.status(400).json({ message: "Email atau Password salah!" });
      }

      // Cek Verifikasi Email
      if (!user.isVerified) {
        return res.status(403).json({
          message: "Akun belum diverifikasi. Silakan cek email Anda.",
          needVerification: true,
        });
      }

      // Cek Banned
      if (!user.isActive)
        return res.status(403).json({ message: "Akun dinonaktifkan." });

      // Reset Lockout & Login Sukses
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockUntil: null },
      });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "rahasia",
        { expiresIn: "1d" }
      );

      await prisma.auditLog.create({
        data: {
          action: "AUTH_LOGIN",
          userId: user.id,
          details: "Login success",
          ipAddress: req.ip,
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
};

module.exports = authController;
