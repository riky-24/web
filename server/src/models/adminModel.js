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

  // [BARU] Simpan Token Reset Password
  saveResetToken: async (id, token, expiryDate) => {
    return await prisma.user.update({
      where: { id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expiryDate,
      },
    });
  },

  // [BARU] Cari Admin berdasarkan Token yang masih berlaku
  findAdminByResetToken: async (token) => {
    return await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Expires harus Lebih Besar (Greater Than) dari sekarang
        },
      },
    });
  },

  // [BARU] Update Password Baru & Hapus Token
  updatePasswordAndClearToken: async (id, hashedPassword) => {
    return await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        // Sekalian buka kunci akun jika sebelumnya terkunci
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });
  },
};

module.exports = adminModel;
