const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");
const loginMiddleware = require("../middlewares/loginMiddleware");
const rateLimitMiddleware = require("../middlewares/rateLimitMiddleware");

// POST /api/login -> Tahap 1 (Cek Password)
// Gunakan 'authLimiter' (Max 5x percobaan)
router.post(
  "/",
  rateLimitMiddleware.authLimiter, // [FIX] Ganti loginLimiter jadi authLimiter
  loginMiddleware.validateInitiate,
  loginController.initiate
);

// POST /api/login/verify -> Tahap 2 (Cek OTP)
// Gunakan 'otpLimiter' (Max 3x percobaan) - Lebih ketat!
router.post(
  "/verify",
  rateLimitMiddleware.otpLimiter, // [FIX] Gunakan limiter khusus OTP
  loginMiddleware.validateMfa,
  loginController.verifyMfa
);

module.exports = router;
