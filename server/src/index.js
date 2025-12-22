require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectDB } = require("./config/database");
const vipService = require("./services/vipResellerService");
const gameRoutes = require("./routes/gameRoutes");

const app = express();
const port = process.env.PORT || 5000;

// ==========================================
// 1. Security & Middlewares
// ==========================================
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ==========================================
// 2. Routes
// ==========================================
app.use("/api/games", gameRoutes);

// TEST ROUTE: VIP Reseller
app.get("/test-vip", async (req, res) => {
  try {
    const profile = await vipService.getProfile();
    res.json({
      status: "success",
      message: "Koneksi ke VIP Reseller Berhasil!",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal terhubung ke VIP Reseller",
      error: error.message,
    });
  }
});

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server Game Topup berjalan dengan aman!",
    timestamp: new Date(),
  });
});

// ==========================================
// 3. Error Handling & Start Server
// ==========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Terjadi kesalahan internal pada server",
  });
});

// HANYA BOLEH ADA SATU app.listen
// Jalankan koneksi database DULU, baru jalankan server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`\n[SERVER] Berjalan di http://localhost:${port}`);
    console.log(`[MODE]   ${process.env.NODE_ENV || "development"}`);
  });
});
