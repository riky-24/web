const jwt = require("jsonwebtoken");

// 1. SOFT AUTH (Bisa Guest / User)
// Digunakan global agar req.user terisi jika ada token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "rahasia");
      req.user = decoded;
    } catch (error) {
      console.error("Token Invalid (Soft Check):", error.message);
      // Lanjut saja, nanti req.user undefined (dianggap Guest)
    }
  }
  next();
};

// 2. STRICT AUTH (Wajib Login)
// Digunakan khusus untuk route yang butuh data user (misal: My Orders, Profile)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Akses ditolak. Silakan login." });
  }

  jwt.verify(token, process.env.JWT_SECRET || "rahasia", (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Token tidak valid atau kedaluwarsa." });
    }
    req.user = user;
    next();
  });
};

// Export sebagai Object agar bisa diambil salah satu atau keduanya
module.exports = { authMiddleware, authenticateToken };
