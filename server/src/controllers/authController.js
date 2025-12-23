const { prisma } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Modul bawaan Node.js untuk random string
const emailService = require("../services/emailService");

const authController = {
  // --- REGISTER (UPDATED: Kirim Email Verifikasi) ---
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // 1. Validasi Dasar
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Semua kolom wajib diisi!" });
      }

      // Validasi XSS
      if (/[<>;]/.test(name)) {
        return res
          .status(400)
          .json({ message: "Nama mengandung karakter terlarang!" });
      }

      // Validasi Password
      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password minimal 8 karakter!" });
      }
      const commonPasswords = ["12345678", "password", "qwertyui", "rahasia"];
      if (commonPasswords.includes(password.toLowerCase())) {
        return res
          .status(400)
          .json({ message: "Gunakan password yang lebih kuat!" });
      }

      // 2. Cek Email Terdaftar
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Registrasi gagal. Cek kembali data Anda." });
      }

      // 3. Generate Username & Hash Password
      let username =
        email.split("@")[0] + Math.floor(1000 + Math.random() * 9000);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. GENERATE TOKEN VERIFIKASI (32 bytes hex)
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // 5. Create User (Status: Belum Verifikasi)
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          username,
          password: hashedPassword,
          role: "USER",
          balance: 0,
          isVerified: false, // Default false
          verificationToken: verificationToken, // Simpan token
        },
      });

      // 6. KIRIM EMAIL (Asynchronous agar user tidak menunggu lama)
      emailService.sendVerificationEmail(newUser.email, verificationToken);

      // Audit Log
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
        message: "Registrasi berhasil! Cek email Anda untuk verifikasi akun.",
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },

  // --- VERIFIKASI EMAIL (FITUR BARU) ---
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.body; // Token dikirim dari Frontend

      if (!token)
        return res.status(400).json({ message: "Token tidak valid." });

      // Cari user berdasarkan token
      const user = await prisma.user.findUnique({
        where: { verificationToken: token },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Link verifikasi tidak valid atau kedaluwarsa." });
      }

      // Aktifkan User & Hapus Token (Single Use)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null, // Hapus token agar tidak bisa dipakai lagi
        },
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

  // --- LOGIN (UPDATED: Cek Verifikasi) ---
  // --- LOGIN (FIXED: Lockout Logic Dikembalikan) ---
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      // 1. Dummy Hash (Anti-Timing Attack)
      // Menggunakan hash bcrypt valid agar tidak error
      if (!user) {
        await bcrypt.compare(password, "$2b$10$abcdefghijklmnopqrstuv");
        return res.status(400).json({ message: "Email atau Password salah!" });
      }

      // 2. CEK STATUS KUNCI (LOCKOUT CHECK) - INI YANG TADI HILANG
      if (user.lockUntil && user.lockUntil > new Date()) {
        const timeLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
        return res.status(403).json({
          message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${timeLeft} menit.`,
        });
      }

      // 3. Cek Password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // --- LOGIKA LOCKOUT (Anti Brute-Force) ---
        const MAX_ATTEMPTS = 5;
        const LOCK_TIME = 30 * 60 * 1000; // 30 Menit

        let newAttempts = user.failedLoginAttempts + 1;
        let newLockUntil = null;

        if (newAttempts >= MAX_ATTEMPTS) {
          newLockUntil = new Date(Date.now() + LOCK_TIME);
        }

        // Update counter ke database
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: newAttempts, lockUntil: newLockUntil },
        });

        // Tetap return pesan umum agar tidak bocor (User Enumeration)
        return res.status(400).json({ message: "Email atau Password salah!" });
      }

      // 4. CEK VERIFIKASI EMAIL
      if (!user.isVerified) {
        return res.status(403).json({
          message: "Akun belum diverifikasi. Silakan cek email Anda.",
          needVerification: true,
        });
      }

      // 5. Cek Status Aktif (Banned)
      if (!user.isActive)
        return res.status(403).json({ message: "Akun dinonaktifkan." });

      // 6. RESET COUNTER (Login Sukses)
      // Hapus catatan gagal karena sudah berhasil login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      });

      // 7. Generate Token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "rahasia", // Fallback secret
        { expiresIn: "1d" }
      );

      // 8. Audit Log
      await prisma.auditLog.create({
        data: {
          action: "AUTH_LOGIN",
          userId: user.id,
          details: "User berhasil login",
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
