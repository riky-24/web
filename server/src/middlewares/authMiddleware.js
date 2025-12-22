const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // 1. Ambil token dari Header (Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      // 2. Verifikasi Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "rahasia");

      // 3. Simpan data user ke request agar bisa dipakai di controller
      req.user = decoded;
    } catch (error) {
      console.error("Token Invalid:", error.message);
      // Jangan return error, biarkan lanjut sebagai Guest (req.user undefined)
      // Kecuali untuk rute yang benar-benar private (nanti kita atur di routes)
    }
  }

  next();
};

module.exports = authMiddleware;
