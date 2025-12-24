require("dotenv").config();

// 1. DAFTAR VARIABEL WAJIB
// Tambahkan variable SMTP agar server menolak nyala jika konfigurasi email kosong
const requiredEnvs = [
  "DATABASE_URL",
  "JWT_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
];

const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);

if (missingEnvs.length > 0) {
  console.error(
    `[FATAL CONFIG ERROR] Environment variable berikut wajib diisi: ${missingEnvs.join(
      ", "
    )}`
  );
  process.exit(1); // Matikan server demi keamanan
}

const appConfig = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,

  // URL Configuration
  appUrl: process.env.APP_URL || "http://localhost:5000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "1d",
  },

  // [BARU] Email Configuration
  // Biar emailService.js nanti ambil dari sini, bukan dari process.env langsung
  mail: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 465, // Default SSL
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Rate Limiter Config
  rateLimit: {
    authWindow: 15 * 60 * 1000, // 15 Menit
    authMax: 50,
    orderWindow: 1 * 60 * 1000, // 1 Menit
    orderMax: 10,
  },
};

module.exports = appConfig;
