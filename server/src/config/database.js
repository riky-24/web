const { PrismaClient } = require("@prisma/client");

// Inisialisasi Prisma Client
// log: ['query'] akan menampilkan query SQL di terminal (bagus untuk debugging di mode dev)
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn"]
      : ["error"],
});

// Test koneksi saat aplikasi mulai
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("[DATABASE] Berhasil terhubung ke PostgreSQL via Prisma");
  } catch (error) {
    console.error("[DATABASE] Gagal terhubung:", error);
    process.exit(1); // Matikan server jika DB mati (Critical)
  }
};

module.exports = { prisma, connectDB };
