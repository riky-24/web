const jwt = require("jsonwebtoken");
const appConfig = require("../config/app"); // Import Config

// [SECURITY CONFIG]
// Ambil Secret dari Central Config
const JWT_SECRET = appConfig.jwt.secret;

// --- HELPER: Verifikasi Token ---
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    return null;
  }
};

const authMiddleware = {
  // 1. OPTIONAL AUTH (Soft Auth)
  // Cek token: Jika valid -> set req.user. Jika tidak -> anggap Guest (lanjut).
  // Cocok untuk: Halaman Home (bisa lihat harga user vs reseller)
  optionalAuth: (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    next();
  },

  // 2. REQUIRED AUTH (Strict Auth)
  // Wajib punya token valid. Jika tidak -> Error 401/403.
  // Cocok untuk: Halaman Order, Profile, History
  requireAuth: (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Akses ditolak. Silakan login." });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res
        .status(403)
        .json({ message: "Token tidak valid atau kedaluwarsa." });
    }

    req.user = decoded;
    next();
  },

  // 3. ROLE GUARD (Admin/Reseller Only)
  // Middleware dinamis untuk membatasi akses berdasarkan role
  // Cara pakai: requireRole("ADMIN", "RESELLER")
  requireRole: (...allowedRoles) => {
    return (req, res, next) => {
      // Pastikan sudah lewat requireAuth dulu (req.user harus ada)
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Silakan login terlebih dahulu." });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: "Anda tidak memiliki izin untuk akses ini." });
      }

      next();
    };
  },
};

module.exports = authMiddleware;
