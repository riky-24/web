const { rateLimit } = require("express-rate-limit");

// Limit untuk Auth (Login/Register)
// Maksimal 50 request per 15 menit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    status: "error",
    message: "Terlalu banyak percobaan login/register. Coba lagi nanti.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Limit untuk Order & Transaksi
// Maksimal 10 request per 1 menit (Cukup untuk user normal)
const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Anda terlalu cepat melakukan request. Harap tunggu sebentar.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, orderLimiter };
