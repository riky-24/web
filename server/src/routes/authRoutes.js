const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Import Middleware Validasi & Security
const {
  validateRegister,
  validateResetPassword,
} = require("../middlewares/validationMiddleware");
const { checkEmailDomain } = require("../middlewares/emailSecurityMiddleware");

// ==========================================
// AUTH ROUTES
// ==========================================

// Register: Validasi Input -> Cek DNS Email -> Proses Controller
router.post(
  "/register",
  validateRegister,
  checkEmailDomain,
  authController.register
);

// Login
router.post("/login", authController.login);

// Verifikasi Email (Link dari email)
router.post("/verify-email", authController.verifyEmail);

// Lupa Password (Request Link)
router.post("/forgot-password", authController.forgotPassword);

// Reset Password: Validasi Password Baru -> Proses Controller
router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword
);

module.exports = router;
