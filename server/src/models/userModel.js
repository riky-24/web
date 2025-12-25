const { prisma } = require("../config/database");

const userModel = {
  // [KHUSUS LOGIN] Ambil password & role
  findForLogin: async (email) => {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, // Hati-hati, ini sensitif
        role: true,
        username: true,
        isVerified: true,
        isActive: true,
        balance: true,
      },
    });
  },

  // [UMUM] Ambil user tanpa password (untuk verifikasi MFA)
  findById: async (id) => {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        isActive: true,
        balance: true,
      },
    });
  },

  // ... (method create, update, delete lainnya tetap ada)
  create: async (data) => {
    return await prisma.user.create({ data });
  },
  update: async (id, data) => {
    return await prisma.user.update({ where: { id }, data });
  },
};

module.exports = userModel;
