require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
// PERBAIKAN DI SINI: Gunakan kurung kurawal { rateLimit }
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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Izinkan gambar dari domain sendiri dan URL eksternal terpercaya
        imgSrc: [
          "'self'",
          "data:",
          "https://cdn.wallpapersafari.com",
          "https://wallpapers.com",
          "https://images.unsplash.com",
        ],
        // Izinkan script hanya dari domain sendiri dan Midtrans
        scriptSrc: [
          "'self'",
          "https://app.sandbox.midtrans.com",
          "https://app.midtrans.com",
        ],
        // Izinkan koneksi API (fetch/axios) ke server sendiri & midtrans
        connectSrc: ["'self'", "https://app.sandbox.midtrans.com"],
        // Izinkan iframe (untuk Snap Midtrans)
        frameSrc: ["'self'", "https://app.sandbox.midtrans.com"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Agar gambar bisa di-load
  })
);
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

// RATE LIMITER (Anti Spam/Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Maksimal 100 request per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Terlalu banyak request, coba lagi nanti.",
  },
});

const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 2, // Order: Maksimal 10 order per menit per IP (Cukup untuk user normal)
  message: "Anda membuat order terlalu cepat. Santai dulu.",
});
// Pasang limiter HANYA di jalur auth agar user tidak kena limit saat cek game
app.use("/api/auth", limiter);

// ==========================================
// 2. Routes
// ==========================================
app.use("/api/games", orderLimiter, gameRoutes);
app.use("/api/auth", authRoutes);
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
