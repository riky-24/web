const { prisma } = require("../config/database");

/**
 * Model Khusus Admin
 * Memastikan semua pencarian user difilter hanya untuk ROLE ADMIN
 */
const adminModel = {
  // Mencari Admin untuk keperluan login awal
  findAdminForLogin: async (email) => {
    return await prisma.user.findFirst({
      where: {
        email: email,
        role: "ADMIN", // Filter wajib: Hanya Admin yang boleh diproses
      },
      select: {
        id: true,
        email: true,
        password: true,
        username: true,
        isActive: true,
        mfaSecret: true, // Dibutuhkan untuk validasi TOTP
        isMfaActive: true,
        role: true,
      },
    });
  },

  // Mencari Admin berdasarkan ID (untuk verifikasi tahap 2 MFA)
  findAdminById: async (id) => {
    return await prisma.user.findFirst({
      where: {
        id: id,
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        mfaSecret: true,
        isMfaActive: true,
      },
    });
  },
};

module.exports = adminModel;
