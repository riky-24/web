const { prisma } = require("../config/database");
const vipService = require("./vipResellerService");
const logModel = require("../models/logModel");
const { DEFAULTS } = require("../config/constants");

const adminService = {
  /**
   * 1. DASHBOARD UTAMA (Cek Kesehatan Rumah)
   * Mengambil statistik penting untuk ditampilkan di Home Admin
   */
  getDashboardStats: async () => {
    // A. Hitung Order Berdasarkan Status
    const orderStats = await prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
    });

    // B. Total User Terdaftar
    const totalUsers = await prisma.user.count();

    // C. Cek Saldo Provider (VIP Reseller) Real-time
    // Supaya admin tau kalau saldo menipis!
    let providerBalance = 0;
    try {
      const vipProfile = await vipService.getProfile();
      providerBalance = vipProfile?.data?.balance || 0;
    } catch (error) {
      console.error("[Admin] Gagal cek saldo VIP:", error.message);
      providerBalance = "Error Connection";
    }

    return {
      totalUsers,
      providerBalance, // PENTING: Saldo modal kita
      orders: orderStats.map((s) => ({
        status: s.status,
        count: s._count.id,
        totalAmount: s._sum.amount || 0,
      })),
    };
  },

  /**
   * 2. PANTAU TRANSAKSI (Filter & Search)
   */
  getAllTransactions: async (page = 1, limit = 20, status = null) => {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, game: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.order.count({ where });

    return {
      data: orders,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * 3. UPDATE CONFIG (Harga & Margin)
   * Fitur sakti untuk mengubah keuntungan tanpa coding ulang
   */
  updateSystemConfig: async (configData) => {
    // Upsert: Kalau belum ada dibuat, kalau ada diupdate
    return await prisma.systemConfig.upsert({
      where: { id: "config" },
      update: configData,
      create: { id: "config", ...configData },
    });
  },

  /**
   * 4. AMBIL CONFIG SAAT INI
   */
  getSystemConfig: async () => {
    const config = await prisma.systemConfig.findUnique({
      where: { id: "config" },
    });
    // Return default kalau belum diset
    return (
      config || {
        marginUser: DEFAULTS.MARGIN.USER,
        marginReseller: DEFAULTS.MARGIN.RESELLER,
        marginVip: DEFAULTS.MARGIN.VIP,
        serviceFee: DEFAULTS.SERVICE_FEE,
        isMaintenance: DEFAULTS.IS_MAINTENANCE,
      }
    );
  },
};

module.exports = adminService;
