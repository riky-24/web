require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
// Tambahkan ini di bawah require lainnya
const { connectDB } = require("./config/database");
// IMPORT SEMENTARA (Nanti dipindah ke Controller)
const vipService = require("./services/vipResellerService");
const gameRoutes = require("./routes/gameRoutes");

const app = express();
const port = process.env.PORT || 5000;

// ==========================================
// 1. Security & Middlewares (Standar OWASP)
// ==========================================

// Helmet: Mengamankan HTTP headers (XSS Protection, dsb)
app.use(helmet());

// CORS: Mengizinkan akses hanya dari Frontend Client kita
app.use(
  cors({
    origin: "http://localhost:5173", // Port default Vite
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parsing Body Request
app.use(express.json()); // Parsing JSON
app.use(express.urlencoded({ extended: true })); // Parsing URL Encoded

// Logging (Membantu monitoring aktivitas server)
app.use(morgan("dev"));

// ==========================================
// 2. Routes
// ==========================================

app.use("/api/games", gameRoutes); // <--- Tambahkan ini

// TEST ROUTE: Cek Koneksi ke VIP Reseller
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

// Test Route (Health Check)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server Game Topup berjalan dengan aman!",
    timestamp: new Date(),
  });
});

// Nanti kita import routes lain di sini (auth, product, order, dll)

// ==========================================
// 3. Error Handling (Global)
// ==========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Terjadi kesalahan internal pada server",
  });
});

//koneksi database
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`\n[SERVER] Berjalan di http://localhost:${port}`);
    console.log(`[MODE]   ${process.env.NODE_ENV || "development"}`);
  });
});

// ==========================================
// 4. Start Server
// ==========================================
app.listen(port, () => {
  console.log(`\n[SERVER] Berjalan di http://localhost:${port}`);
  console.log(`[MODE]   ${process.env.NODE_ENV || "development"}`);
});
