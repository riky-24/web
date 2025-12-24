require("dotenv").config();

// Daftar variabel wajib (Server gak boleh nyala kalau ini kosong)
const requiredEnvs = ["DATABASE_URL", "JWT_SECRET"];
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
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173", // URL Frontend

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "1d", // Standar 1 hari
  },

  // Rate Limiter Config (Pusat pengaturan batas request)
  rateLimit: {
    authWindow: 15 * 60 * 1000, // 15 Menit
    authMax: 50, // Max 50 request
    orderWindow: 1 * 60 * 1000, // 1 Menit
    orderMax: 10, // Max 10 request
  },
};

module.exports = appConfig;
