const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");
// [BARU] Import Security Config
const securityConfig = require("../config/security");

const limitHandler = (req, res, next, options) => {
  logger.warn(`Rate Limit Exceeded: ${req.ip}`, "SecurityAlert");
  return response.error(
    res,
    "Terlalu banyak permintaan. Coba lagi nanti.",
    429
  );
};

const rateLimitMiddleware = {
  // GLOBAL LIMITER
  globalLimiter: rateLimit({
    windowMs: securityConfig.rateLimit.global.windowMs, // [FIX] Ambil dari Config
    max: securityConfig.rateLimit.global.max, // [FIX] Ambil dari Config
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHandler,
  }),

  // AUTH LIMITER (Login)
  authLimiter: rateLimit({
    windowMs: securityConfig.rateLimit.auth.windowMs,
    max: securityConfig.rateLimit.auth.max,
    handler: (req, res) => {
      logger.error(`Brute Force Auth: ${req.ip}`, "SecurityCritical");
      return response.error(
        res,
        "Terlalu banyak percobaan login. IP diblokir sementara.",
        429
      );
    },
  }),

  // OTP LIMITER
  otpLimiter: rateLimit({
    // Bos bisa ganti nama jadi loginLimiter jika mau disatukan
    windowMs: securityConfig.rateLimit.otp.windowMs,
    max: securityConfig.rateLimit.otp.max,
    handler: (req, res) => {
      logger.warn(`OTP Brute Force: ${req.ip}`, "SecurityAlert");
      return response.error(res, "Kode salah terlalu sering.", 429);
    },
  }),
};

module.exports = rateLimitMiddleware;
