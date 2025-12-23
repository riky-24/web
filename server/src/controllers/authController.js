const { prisma } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/emailService");
const dns = require("dns");

const authController = {
  // ==========================================
  // 1. REGISTER (Secure: Anti-Enumeration & Validation)
  // ==========================================
  register: async (req, res) => {
    // Variable di luar try agar bisa diakses di catch untuk rollback
    let newUser = null;

    try {
      const { name, email, password } = req.body;

      // --- 1. Validasi Input Strict ---
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Semua kolom wajib diisi!" });
      }

      // Regex: Hanya huruf, angka, spasi, titik, koma, petik satu, strip.
      // Mencegah karakter kontrol berbahaya seperti < > ; { }
      const safeNameRegex = /^[a-zA-Z0-9\s.,'-]+$/;
      if (!safeNameRegex.test(name)) {
        return res
          .status(400)
          .json({ message: "Nama mengandung karakter yang tidak diizinkan!" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password minimal 8 karakter!" });
      }

      // Normalisasi email agar case-insensitive
      const normalizedEmail = email.toLowerCase();

      // --- 2. Validasi Domain Email (DNS Lookup dengan Timeout) ---
      // Mencegah server hang jika DNS lambat
      const domain = normalizedEmail.split("@")[1];
      const isValidDomain = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000); // 5 detik timeout
        dns.resolveMx(domain, (err, addresses) => {
          clearTimeout(timeout);
          if (err || !addresses || addresses.length === 0) resolve(false);
          else resolve(true);
        });
      });

      if (!isValidDomain) {
        return res
          .status(400)
          .json({ message: "Domain email tidak valid atau tidak ditemukan!" });
      }

      // --- 3. Pre-Computation (Mitigasi Timing Attack) ---
      // Kita hash password DULU sebelum cek database.
      // Ini memastikan waktu proses selalu lama (karena bcrypt),
      // baik user baru maupun user lama.
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // --- 4. Cek Email Terdaftar (Silent Check) ---
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        // SECURITY: Return SUKSES palsu.
        // Jangan beritahu "Email sudah terdaftar" untuk mencegah Enumeration.
        return res.status(200).json({
          status: "success",
          message: "Registrasi berhasil! Cek email Anda untuk verifikasi akun.",
        });
      }

      // --- 5. Persiapan Data & Token ---
      let username =
        normalizedEmail.split("@")[0] + Math.floor(1000 + Math.random() * 9000);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // --- 6. SIMPAN KE DB ---
      newUser = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          username,
          password: hashedPassword,
          role: "USER",
          balance: 0,
          isVerified: false,
          verificationToken: verificationToken,
        },
      });

      // --- 7. KIRIM EMAIL ---
      const emailSent = await emailService.sendVerificationEmail(
        newUser.email,
        verificationToken
      );

      // Jika gagal kirim email, hapus user agar tidak jadi sampah data
      if (!emailSent) {
        await prisma.user.delete({ where: { id: newUser.id } });
        return res.status(500).json({
          message: "Gagal mengirim email verifikasi. Silakan coba lagi.",
        });
      }

      // --- 8. Audit Log ---
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

      // Rollback jika terjadi crash setelah user terbuat
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
  // 3. LOGIN (Secure: Lockout & Timing Safe)
  // ==========================================
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email ? email.toLowerCase() : "";

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // Pesan Error Generik (PENTING untuk keamanan)
      const invalidMsg = "Email atau Password salah!";

      // --- Mitigasi Timing Attack ---
      // Jika user tidak ditemukan, kita tetap jalankan hashing palsu
      // agar waktunya mirip dengan jika user ditemukan.
      if (!user) {
        await bcrypt.compare(
          password || "dummy",
          "$2b$10$abcdefghijklmnopqrstuv"
        );
        return res.status(400).json({ message: invalidMsg });
      }

      // Cek Lockout (Brute Force Protection)
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
        const LOCK_TIME = 30 * 60 * 1000; // 30 Menit
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

      // Cek Verifikasi Email
      if (!user.isVerified) {
        return res.status(403).json({
          message: "Akun belum diverifikasi. Silakan cek email Anda.",
          needVerification: true,
        });
      }

      // Cek Status Aktif/Banned
      if (user.isActive === false) {
        return res.status(403).json({ message: "Akun dinonaktifkan." });
      }

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
  // 4. FORGOT PASSWORD (Secure: Silent)
  // ==========================================
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email ? email.toLowerCase() : "";

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // SECURITY: Selalu return sukses (200) meski user tidak ada.
      if (!user) {
        return res.status(200).json({
          message: "Link reset password telah dikirim ke email Anda.",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 Jam

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
      console.error("Forgot Password Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },

  // ==========================================
  // 5. RESET PASSWORD
  // ==========================================
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Semua data wajib diisi!" });
      }

      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ message: "Konfirmasi password tidak cocok!" });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "Password minimal 8 karakter!" });
      }

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: new Date(), // Belum expired
          },
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
      console.error("Reset Password Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },
};

module.exports = authController;
