const express = require("express");
const appConfig = require("./config/app");
const { connectDB } = require("./config/database");
const {
  helmetConfig,
  corsConfig,
} = require("./middlewares/securityMiddleware");
const { globalLimiter } = require("./middlewares/rateLimitMiddleware");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { protectAdmin } = require("./middlewares/authMiddleware");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// 1. GLOBAL SECURITY (Armor)
app.use(helmetConfig); // Security Headers
app.use(corsConfig); // Whitelist Frontend Domain
app.use(globalLimiter); // Anti Brute-force Global

// 2. PARSER & LOGGER
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. ADMIN ENDPOINTS
app.get("/", (req, res) => res.json({ status: "ready", server: "Admin-Only" }));
app.use("/api/admin/auth", adminRoutes);
// RUTE DASHBOARD (DIPROTEKSI TOTAL)
// Hanya admin yang sudah login + MFA yang bisa akses rute di bawah ini
app.use("/api/admin/dashboard", protectAdmin, (req, res) => {
  res.json({
    status: "success",
    message: "Selamat datang di Markas Komando Admin.",
    adminId: req.admin.id,
  });
});

// 4. ERROR HANDLING
app.use(notFound);
app.use(errorHandler);

// 5. BOOTSTRAP
connectDB().then(() => {
  app.listen(appConfig.port, () => {
    console.log(`\n[ADMIN-SERVER] Aktif di http://localhost:${appConfig.port}`);
    console.log(`[CORE] Role Enforcement: ADMIN ONLY`);
    console.log(`[AUTH] MFA Requirement: MANDATORY`);
  });
});
