const { prisma } = require("../config/database");

const adminModel = {
  findAdminForLogin: async (email) => {
    return await prisma.user.findFirst({
      where: { email: email, role: "ADMIN" },
      select: {
        id: true,
        email: true,
        password: true,
        username: true,
        isActive: true,
        mfaSecret: true,
        isMfaActive: true,
        role: true,
        // AMBIL DATA LOCKING
        failedLoginAttempts: true, //
        lockUntil: true, //
      },
    });
  },

  findAdminById: async (id) => {
    return await prisma.user.findFirst({
      where: { id: id, role: "ADMIN" },
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

  // [BARU] Catat kegagalan login
  incrementLoginAttempts: async (id, currentAttempts) => {
    return await prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: currentAttempts + 1 },
    });
  },

  // [BARU] Kunci akun sementara (misal 30 menit)
  lockAccount: async (id) => {
    const lockTime = new Date(Date.now() + 30 * 60 * 1000); // 30 Menit dari sekarang
    return await prisma.user.update({
      where: { id },
      data: {
        lockUntil: lockTime,
        failedLoginAttempts: 0, // Reset counter biar bersih setelah lock habis
      },
    });
  },

  // [BARU] Reset counter jika login berhasil
  resetLoginAttempts: async (id) => {
    return await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });
  },
};

module.exports = adminModel;
