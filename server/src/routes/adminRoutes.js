const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuthController");
const {
  authLimiter,
  otpLimiter,
} = require("../middlewares/rateLimitMiddleware");

// Inisiasi Login (Cek Password) - Max 5 percobaan per IP
router.post("/login", authLimiter, adminAuthController.login);

// Verifikasi OTP - Max 3 percobaan (Lebih ketat untuk Admin)
router.post("/verify-otp", otpLimiter, adminAuthController.verifyOtp);

module.exports = router;
