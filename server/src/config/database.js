const { PrismaClient } = require("@prisma/client");

// Inisialisasi Prisma
const prisma = new PrismaClient({
  // Log query hanya di development biar console bersih di production
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("[DATABASE] Terhubung ke Database (Prisma) ✅");
  } catch (error) {
    console.error("[DATABASE] Gagal terhubung ke Database ❌", error);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
