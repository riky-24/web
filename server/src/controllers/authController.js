const { prisma } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authController = {
  // --- FITUR REGISTER ---
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Semua kolom wajib diisi!" });
      }

      if (password.length < 8) {
        // Tambahan sesuai standar ASVS
        return res
          .status(400)
          .json({ message: "Password minimal 8 karakter!" });
      }

      // 1. Cek Email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser)
        return res.status(400).json({ message: "Email sudah digunakan!" });

      // 2. Auto-Generate Username Unik
      // Contoh: riky@gmail.com -> riky8821
      let username =
        email.split("@")[0] + Math.floor(1000 + Math.random() * 9000);

      // Cek bentrok username (langka tapi mungkin)
      const checkUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (checkUsername) {
        username = username + Math.floor(Math.random() * 100);
      }

      // 3. Hash Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Create User (Sesuai Schema Baru)
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          username, // Field baru wajib diisi
          password: hashedPassword,
          role: "USER",
          balance: 0,
        },
      });

      // 5. Catat ke Audit Log (Fitur baru Schema Anda)
      await prisma.auditLog.create({
        data: {
          action: "AUTH_REGISTER",
          userId: newUser.id,
          details: "User mendaftar akun baru",
          ipAddress: req.ip,
        },
      });

      res.status(201).json({
        status: "success",
        message: "Registrasi berhasil! Silakan login.",
        data: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
        },
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },

  // --- FITUR LOGIN ---
  // --- FITUR LOGIN (UPDATED) ---
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // 1. Cari user berdasarkan email
      const user = await prisma.user.findUnique({ where: { email } });

      // Jika user tidak ditemukan, return error umum (Security Best Practice)
      if (!user)
        return res.status(400).json({ message: "Email atau Password salah!" });

      // 2. CEK STATUS KUNCI (LOCKOUT CHECK)
      if (user.lockUntil && user.lockUntil > new Date()) {
        // Hitung sisa waktu kunci
        const timeLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
        return res.status(403).json({
          message: `Akun terkunci sementara karena terlalu banyak percobaan gagal. Silakan coba lagi dalam ${timeLeft} menit.`,
        });
      }

      // 3. Cek Password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // --- LOGIKA JIKA PASSWORD SALAH ---

        const MAX_ATTEMPTS = 5; // Batas maksimal salah
        const LOCK_TIME = 30 * 60 * 1000; // Kunci 30 menit

        let newAttempts = user.failedLoginAttempts + 1;
        let newLockUntil = null;

        // Jika sudah mencapai batas, kunci akun
        if (newAttempts >= MAX_ATTEMPTS) {
          newLockUntil = new Date(Date.now() + LOCK_TIME);
          // Reset attempts agar nanti setelah buka kunci mulai dari 0 lagi atau biarkan
          // Biasanya direset nanti saat login sukses.
        }

        // Update ke database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newAttempts,
            lockUntil: newLockUntil,
          },
        });

        // Beri peringatan sisa percobaan
        const attemptsLeft = MAX_ATTEMPTS - newAttempts;
        if (attemptsLeft > 0) {
          return res.status(400).json({
            message: `Password salah! Sisa percobaan: ${attemptsLeft} kali sebelum akun dikunci.`,
          });
        } else {
          return res.status(403).json({
            message: "Akun Anda telah dikunci sementara demi keamanan.",
          });
        }
      }

      // 4. LOGIKA JIKA LOGIN SUKSES

      // Cek Status Aktif (Admin Ban)
      if (!user.isActive)
        return res.status(403).json({ message: "Akun Anda dinonaktifkan." });

      // --- RESET COUNTER (PENTING!) ---
      // Karena login berhasil, kita hapus catatan dosa sebelumnya
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      });

      // Buat Token (Sama seperti sebelumnya)
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "rahasia",
        { expiresIn: "1d" }
      );

      // Catat Audit Log
      await prisma.auditLog.create({
        data: {
          action: "AUTH_LOGIN",
          userId: user.id,
          details: "User berhasil login",
          ipAddress: req.ip,
        },
      });

      // Kirim Response
      res.json({
        status: "success",
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
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
