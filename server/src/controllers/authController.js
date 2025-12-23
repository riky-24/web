const { prisma } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/emailService");
const dns = require("dns");

const authController = {
  // ==========================================
  // 1. REGISTER (Updated: Strict Validation)
  // ==========================================
  register: async (req, res) => {
    // Variable di luar try agar bisa diakses di catch untuk rollback
    let newUser = null;

    try {
      const { name, email, password } = req.body;

      // --- 1. Validasi Input Dasar ---
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Semua kolom wajib diisi!" });
      }
      if (/[<>;]/.test(name)) {
        return res
          .status(400)
          .json({ message: "Nama mengandung karakter terlarang!" });
      }
      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password minimal 8 karakter!" });
      }

      // --- 2. Validasi Domain Email (DNS Lookup) ---
      // Ini akan menolak email seperti "asal@ngawur.com" yang domainnya tidak ada
      const domain = email.split("@")[1];
      const isValidDomain = await new Promise((resolve) => {
        dns.resolveMx(domain, (err, addresses) => {
          if (err || !addresses || addresses.length === 0) resolve(false);
          else resolve(true);
        });
      });

      if (!isValidDomain) {
        return res
          .status(400)
          .json({ message: "Domain email tidak valid atau tidak ditemukan!" });
      }

      // --- 3. Cek Email Terdaftar di Database ---
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email sudah terdaftar." });
      }

      // --- 4. Persiapan Data ---
      let username =
        email.split("@")[0] + Math.floor(1000 + Math.random() * 9000);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // --- 5. SIMPAN KE DB (Transactional Check) ---
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

      // --- 6. KIRIM EMAIL ---
      const emailSent = await emailService.sendVerificationEmail(
        newUser.email,
        verificationToken
      );

      // Jika gagal kirim email (misal SMTP down), hapus user langsung
      if (!emailSent) {
        await prisma.user.delete({ where: { id: newUser.id } });
        return res.status(500).json({
          message: "Gagal mengirim email verifikasi. Data dibatalkan.",
        });
      }

      // --- 7. Audit Log ---
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

      // --- ROLLBACK MECHANISM ---
      // Jika terjadi error apapun (misal error audit log),
      // tapi user terlanjur terbuat, kita hapus agar tidak jadi zombie.
      if (newUser) {
        try {
          await prisma.user.delete({ where: { id: newUser.id } });
        } catch (cleanupError) {
          console.error("Gagal cleanup user:", cleanupError);
        }
      }

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
        return res.status(403).json({
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

  // ==========================================
  // 4. FORGOT PASSWORD (Kirim Link Reset)
  // ==========================================
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // 1. Cari User
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // SECURITY: Jangan kasih tau kalau email tidak ada (Anti-Enumeration)
        // Pura-pura sukses agar hacker tidak bisa scan database email.
        return res.status(200).json({
          message: "Link reset password telah dikirim ke email Anda.",
        });
      }

      // 2. Generate Token Reset
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 Jam dari sekarang

      // 3. Simpan Token ke Database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpires,
        },
      });

      // 4. Kirim Email
      await emailService.sendResetPasswordEmail(user.email, resetToken);

      res.json({ message: "Link reset password telah dikirim ke email Anda." });
    } catch (error) {
      console.error("Forgot Password Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },
};

module.exports = authController;
