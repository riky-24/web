const helmet = require("helmet");
const cors = require("cors");

// Konfigurasi CSP (Content Security Policy)
// Penting untuk mengizinkan resource dari luar (Google Fonts, Midtrans, Image)
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      // Izinkan style inline untuk React (style={{...}}) & Google Fonts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

      // Izinkan font dari Google
      fontSrc: ["'self'", "https://fonts.gstatic.com"],

      // Izinkan gambar dari mana saja (User upload, Unsplash, dll)
      imgSrc: ["'self'", "data:", "blob:", "*"],

      // Izinkan script penting (Midtrans & Self)
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://app.sandbox.midtrans.com",
        "https://app.midtrans.com",
      ],

      // Izinkan koneksi ke Midtrans
      connectSrc: [
        "'self'",
        "https://app.sandbox.midtrans.com",
        "https://app.midtrans.com",
      ],

      // Izinkan iframe Midtrans (Snap Pop-up)
      frameSrc: [
        "'self'",
        "https://app.sandbox.midtrans.com",
        "https://app.midtrans.com",
      ],
    },
  },
  // Matikan proteksi ini agar browser mau memuat gambar lintas domain
  crossOriginResourcePolicy: false,
});

// Konfigurasi CORS (Cross-Origin Resource Sharing)
// Mengatur siapa saja yang boleh menembak API kita
const corsConfig = cors({
  origin: "http://localhost:5173", // Sesuaikan dengan URL Frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

module.exports = { helmetConfig, corsConfig };
