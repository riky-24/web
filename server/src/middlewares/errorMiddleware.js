const logger = require("../utils/logger");

const errorMiddleware = {
  // 1. PENANGANAN 404 (JALAN BUNTU)
  // Dipanggil jika user akses URL yang tidak ada
  notFound: (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Lempar ke errorHandler di bawah
  },

  // 2. PENANGANAN ERROR GLOBAL (500)
  // Semua error dari codingan (throw new Error) akan bermuara di sini
  errorHandler: (err, req, res, next) => {
    // Kalau status codenya masih 200 (sukses), paksa jadi 500 (error server)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // --- REKAM BUKTI FORENSIK (CCTV) ---
    // Kita catat: Method, URL, IP Pelaku, dan Pesan Errornya
    logger.error(
      `[SYSTEM_ERROR] ${req.method} ${req.originalUrl} | IP: ${req.ip} | Msg: ${err.message}`
    );

    // --- JAWAB USER ---
    // Gunakan format standar responseHelper
    return response.error(
      res,
      err.message,
      statusCode,
      // Di Production, jangan kasih lihat stack trace (rahasia dapur)
      process.env.NODE_ENV === "production" ? null : err.stack
    );
  },
};

module.exports = errorMiddleware;
