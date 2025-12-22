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
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Cari user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user)
        return res.status(400).json({ message: "Email atau Password salah!" });

      // Cek Password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Email atau Password salah!" });

      // Cek Status Aktif (Fitur baru schema Anda)
      if (!user.isActive)
        return res.status(403).json({ message: "Akun Anda dinonaktifkan." });

      // Buat Token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "rahasia",
        { expiresIn: "1d" }
      );

      // Catat Audit Log Login
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
