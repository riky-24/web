require("dotenv").config();

// Validasi variabel kritis (Biar gak kaget pas di Production)
const requiredEnvs = ["JWT_SECRET", "DATABASE_URL"];
requiredEnvs.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[FATAL ERROR] Config ${key} tidak ditemukan di .env`);
    process.exit(1); // Matikan server segera
  }
});

const appConfig = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,

  // URL Frontend (Penting untuk CORS)
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  // Konfigurasi JWT (Token)
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: "15m", // Token akses pendek (aman)
    refreshExpiresIn: "7d", // Token refresh panjang (nyaman) - Persiapan masa depan
    preAuthExpiresIn: "5m", // Token "Ruang Tunggu" MFA
  },

  // Konfigurasi Email (Nanti untuk kirim OTP)
  mail: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

module.exports = appConfig;
