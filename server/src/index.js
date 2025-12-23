require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const { connectDB } = require("./config/database");
const vipService = require("./services/vipResellerService");

const gameRoutes = require("./routes/gameRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const port = process.env.PORT || 5000;

// ==========================================
// 1. Security & Middlewares
// ==========================================

// --- KONFIGURASI CSP (DIPERBAIKI UNTUK GAMEDETAIL) ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        // 1. IZINKAN STYLE INLINE (PENTING!)
        // Ini wajib agar 'style={{ backgroundImage: ... }}' di GameDetail.jsx bisa jalan.
        // Tanpa ini, background hero akan blank/putih.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

        // 2. IZINKAN FONT GOOGLE
        fontSrc: ["'self'", "https://fonts.gstatic.com"],

        // 3. IZINKAN SEMUA GAMBAR
        // Kita pakai "*" agar gambar dari link manapun (Unsplash, Google, dll) bisa muncul.
        // Ini aman karena gambar tidak bisa dieksekusi jadi virus.
        imgSrc: ["'self'", "data:", "blob:", "*"],

        // 4. SCRIPT & KONEKSI (TETAP KETAT / AMAN)
        // Kita HANYA mengizinkan script dari server kita sendiri dan Midtrans.
        // Script dari domain hacker (ex: xss-attack.com) tetap AKAN DIBLOKIR browser.
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://app.sandbox.midtrans.com",
          "https://app.midtrans.com",
        ],
        connectSrc: [
          "'self'",
          "https://app.sandbox.midtrans.com",
          "https://app.midtrans.com",
        ],
        frameSrc: [
          "'self'",
          "https://app.sandbox.midtrans.com",
          "https://app.midtrans.com",
        ],
      },
    },
    // Matikan proteksi ini agar browser mau memuat gambar dari domain lain
    crossOriginResourcePolicy: false,
  })
);
// -----------------------------------------------------

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

// --- RATE LIMITER (Anti Spam) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { status: "error", message: "Terlalu banyak percobaan login." },
});

const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // Limit 20 request per menit (Cukup buat user normal)
  message: { status: "error", message: "Anda terlalu cepat. Santai dulu." },
});

// ==========================================
// 2. Routes
// ==========================================
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/games", orderLimiter, gameRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server Game Topup berjalan dengan aman!",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Terjadi kesalahan internal pada server",
  });
});

// START SERVER
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`\n[SERVER] Berjalan di http://localhost:${port}`);
  });
});
