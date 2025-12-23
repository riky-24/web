const jwt = require("jsonwebtoken");

// [SECURITY CRITICAL]
// Pastikan JWT_SECRET diambil dari environment variable.
// Jika tidak ada, fallback "rahasia" HANYA boleh untuk development,
// tapi sangat disarankan untuk memaksa error di production.
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

if (!process.env.JWT_SECRET) {
  console.warn(
    "[SECURITY WARNING] JWT_SECRET tidak diset di .env. Menggunakan default 'rahasia' (Sangat Tidak Aman untuk Production!)"
  );
}

// 1. SOFT AUTH (Bisa Guest / User)
// Digunakan global agar req.user terisi jika ada token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      // Enforce algorithm untuk keamanan ekstra
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
      req.user = decoded;
    } catch (error) {
      // Token invalid/expired di soft auth tidak boleh bikin error,
      // cukup anggap user sebagai guest.
      // console.error("Soft Auth Token Warning:", error.message);
    }
  }
  next();
};

// 2. STRICT AUTH (Wajib Login)
// Digunakan khusus untuk route yang butuh data user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Akses ditolak. Silakan login." });
  }

  jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Token tidak valid atau kedaluwarsa." });
    }
    req.user = user;
    next();
  });
};

// Export sebagai Object
module.exports = { authMiddleware, authenticateToken };
