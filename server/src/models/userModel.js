const { prisma } = require("../config/database");

const userModel = {
  // [KHUSUS LOGIN] Ambil password, role, DAN RAHASIA MFA
  findForLogin: async (email) => {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, // Sensitif 1: Hash Password
        role: true,
        username: true,
        isVerified: true,
        isActive: true,
        balance: true,
        // [BARU] Data untuk Real MFA
        mfaSecret: true, // Sensitif 2: Kunci Authenticator
        isMfaActive: true, // Status apakah MFA nyala
      },
    });
  },

  // [UMUM] Ambil user by ID (termasuk secret untuk verifikasi tahap 2)
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
        // [BARU] Perlu secret untuk verifikasi kode OTP
        mfaSecret: true,
        isMfaActive: true,
      },
    });
  },

  create: async (data) => {
    return await prisma.user.create({ data });
  },

  update: async (id, data) => {
    return await prisma.user.update({ where: { id }, data });
  },
};

module.exports = userModel;
