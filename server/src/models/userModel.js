const { prisma } = require("../config/database");

const userModel = {
  // Cari user berdasarkan ID
  findById: async (id) => {
    return await prisma.user.findUnique({ where: { id } });
  },

  // Cari user berdasarkan Email (untuk Login/Register)
  findByEmail: async (email) => {
    return await prisma.user.findUnique({ where: { email } });
  },

  // Cari user berdasarkan Token Verifikasi Email
  findByVerificationToken: async (token) => {
    return await prisma.user.findUnique({
      where: { verificationToken: token },
    });
  },

  // Cari user berdasarkan Token Reset Password yang belum kadaluwarsa
  findByResetToken: async (token) => {
    return await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }, // Token harus masih berlaku
      },
    });
  },

  // Buat User Baru
  create: async (data) => {
    return await prisma.user.create({ data });
  },

  // Update Data User
  update: async (id, data) => {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  // Hapus User (Misal untuk cleanup registrasi gagal)
  delete: async (id) => {
    return await prisma.user.delete({ where: { id } });
  },
};

module.exports = userModel;
