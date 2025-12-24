require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const { connectDB } = require("./config/database");
const { startCleanupJob } = require("./services/cleanupService");

// --- IMPORT ROUTE ---
const gameRoutes = require("./routes/gameRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

// --- IMPORT MIDDLEWARES ---
const {
  authLimiter,
  orderLimiter,
} = require("./middlewares/rateLimitMiddleware");
const {
  helmetConfig,
  corsConfig,
} = require("./middlewares/securityMiddleware");
// Import Error Handler Baru
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();
const port = process.env.PORT || 5000;

// ==========================================
// 1. Security & Global Middlewares
// ==========================================
app.use(helmetConfig);
app.use(corsConfig);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. Routes (Pintu Masuk)
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server Game Topup berjalan dengan aman!",
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/games", orderLimiter, gameRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);

// ==========================================
// 3. Error Handling (Pintu Keluar Terakhir)
// ==========================================

// Handle 404 (Jika rute tidak ditemukan)
app.use(notFound);

// Handle Global Error (Jika ada crash/error)
app.use(errorHandler);

// ==========================================
// 4. Start Server
// ==========================================
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`\n[SERVER] Berjalan di http://localhost:${port}`);
    startCleanupJob();
  });
});
