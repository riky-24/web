const { prisma } = require("../config/database");

const orderModel = {
  // Buat Order Baru
  create: async (data) => {
    return await prisma.order.create({ data });
  },

  // Cari Order berdasarkan ID Internal (UUID/Int)
  findById: async (id) => {
    return await prisma.order.findUnique({
      where: { id },
      include: { product: true }, // Include info produk agar lengkap
    });
  },

  // Cari Order berdasarkan TrxID kita (Format: TRX-XXXX)
  findByTrxId: async (trxId) => {
    return await prisma.order.findUnique({
      where: { trxId },
      include: { product: true },
    });
  },

  // Update Status atau Data Order
  update: async (id, data) => {
    return await prisma.order.update({
      where: { id },
      data,
    });
  },

  // Ambil Riwayat Order User (dengan Pagination limit)
  findByUserId: async (userId, limit = 50) => {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            name: true,
            game: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  // Cari order yang statusnya pending (untuk Cron Job / Pengecekan otomatis)
  findPendingOrders: async () => {
    return await prisma.order.findMany({
      where: { status: "pending" },
    });
  },
};

module.exports = orderModel;
