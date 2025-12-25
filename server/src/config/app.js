require("dotenv").config();

/**
 * Validasi Variabel Lingkungan Kritis
 * Memastikan server tidak jalan jika secret key belum diset
 */
const requiredEnvs = ["JWT_SECRET", "DATABASE_URL"];
requiredEnvs.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[FATAL ERROR] Config ${key} tidak ditemukan di .env`);
    process.exit(1);
  }
});

const appConfig = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  // Konfigurasi Keamanan Token Admin
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: "30m", // Akses admin sedikit lebih lama tapi tetap aman
    preAuthExpiresIn: "5m", // Durasi token selama verifikasi MFA
  },
};

module.exports = appConfig;
