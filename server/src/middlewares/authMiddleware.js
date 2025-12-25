const jwt = require("jsonwebtoken");
const appConfig = require("../config/app");
const response = require("../utils/responseHelper");
const { ROLES, MESSAGES } = require("../config/constants");

/**
 * Middleware untuk memproteksi rute Dashboard Admin
 * Hanya mengizinkan Admin yang sudah lolos autentikasi password DAN MFA
 *
 */
const protectAdmin = (req, res, next) => {
  let token;

  // 1. Ambil token dari header Authorization (Bearer Token)
  //
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Jika tidak ada token, langsung tendang (Unauthorized)
  //
  if (!token) {
    return response.error(res, "Akses ditolak. Token tidak ditemukan.", 401);
  }

  try {
    // 2. Verifikasi keaslian token menggunakan JWT Secret
    //
    const decoded = jwt.verify(token, appConfig.jwt.secret);

    // 3. CEK STATUS MFA: Wajib 'FULL'
    // Jika status masih 'PRE_AUTH', berarti dia belum verifikasi kode OTP
    //
    if (decoded.status !== "FULL") {
      return response.error(
        res,
        "Verifikasi MFA diperlukan untuk akses ini.",
        403
      );
    }

    // 4. CEK ROLE: Harus sesuai dengan ROLES.ADMIN di Constants
    // Karena sekarang Role kita eksklusif, pengecekan jadi lebih ketat
    //
    if (decoded.role !== ROLES.ADMIN) {
      return response.error(res, MESSAGES.AUTH.UNAUTHORIZED_ROLE, 403);
    }

    // 5. Simpan data admin ke object 'req' agar bisa diakses di controller berikutnya
    //
    req.admin = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Tangkap jika token expired atau dimanipulasi
    //
    return response.error(res, "Sesi tidak valid atau kadaluwarsa.", 401);
  }
};

module.exports = { protectAdmin };
