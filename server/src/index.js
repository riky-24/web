const express = require("express");
const appConfig = require("./config/app");
const { connectDB } = require("./config/database");
const { globalLimiter } = require("./middlewares/rateLimitMiddleware");
const {
  helmetConfig,
  corsConfig,
} = require("./middlewares/securityMiddleware");
const adminAuthController = require("./controllers/adminAuthController");

const app = express();

// MIDDLEWARE PERTAHANAN
app.use(helmetConfig);
app.use(corsConfig);
app.use(globalLimiter);
app.use(express.json());

// ROUTE KHUSUS ADMIN
// Tahap 1: Cek Password
app.post("/api/admin/login", adminAuthController.login);
// Tahap 2: Cek OTP
app.post("/api/admin/verify-mfa", adminAuthController.verifyMfa);

// Jalankan Database & Server
connectDB().then(() => {
  app.listen(appConfig.port, () => {
    console.log(`\n[ADMIN SERVER] Berjalan di port ${appConfig.port}`);
    console.log(`[SECURITY] MFA Enforcement: ACTIVE`);
    console.log(`[SECURITY] Admin Role Filter: ACTIVE`);
  });
});
