const { prisma } = require("../config/database");
const vipService = require("../services/vipResellerService");

const orderController = {
  // ==========================================
  // 1. BUAT ORDER BARU
  // ==========================================
  createOrder: async (req, res) => {
    try {
      // [CLEANUP] Tidak perlu cek if (!req.user) lagi
      // karena sudah dijaga oleh middleware 'requireAuth' di routes.

      const userId = req.user.id; // Ambil ID dari token
      const { serviceCode, target, serverId } = req.body;

      if (!serviceCode || !target) {
        return res.status(400).json({ message: "Data pesanan tidak lengkap." });
      }

      // 1. Cek User di DB (untuk memastikan saldo & validitas)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return res.status(404).json({ message: "User tidak ditemukan." });

      // 2. Cek Layanan & Harga dari VIP Reseller (atau Cache DB)
      // (Asumsi: Anda punya fungsi untuk cek harga, contoh sederhana:)
      const product = await vipService.checkPrice(serviceCode);
      if (!product)
        return res.status(400).json({ message: "Layanan tidak tersedia." });

      // Logic Margin Profit (Bisa dipisah ke helper)
      const margin = 1.05; // Contoh untung 5%
      const sellingPrice = Math.ceil(product.price * margin);

      // 3. Cek Saldo User
      if (user.balance < sellingPrice) {
        return res.status(400).json({ message: "Saldo tidak mencukupi." });
      }

      // 4. Kurangi Saldo (Gunakan Transaction agar aman!)
      // Prisma Transaction: Pastikan saldo terpotong DAN order tercatat, atau tidak sama sekali.
      const newOrder = await prisma.$transaction(async (tx) => {
        // A. Potong Saldo
        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: sellingPrice } },
        });

        // B. Buat Record Order Lokal
        const order = await tx.order.create({
          data: {
            userId: userId,
            trxId: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            serviceCode: serviceCode,
            target: target,
            serverId: serverId || null,
            price: sellingPrice,
            status: "PROCESSING", // Status awal
            providerOrderId: null, // Nanti diisi setelah tembak VIP
          },
        });

        return order;
      });

      // 5. Tembak ke Provider (VIP Reseller)
      // Dilakukan di luar transaksi DB agar tidak menahan koneksi database lama-lama
      const providerResponse = await vipService.placeOrder(
        serviceCode,
        target,
        serverId
      );

      // 6. Update Status Order berdasarkan respon Provider
      if (providerResponse.status === "success") {
        await prisma.order.update({
          where: { id: newOrder.id },
          data: {
            status: "PENDING", // Atau 'SUCCESS' tergantung respon VIP
            providerOrderId: providerResponse.trxid,
          },
        });

        res.status(201).json({
          status: "success",
          message: "Pesanan berhasil diproses!",
          data: newOrder,
        });
      } else {
        // [REFUND] Jika provider gagal, kembalikan saldo user
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { balance: { increment: sellingPrice } },
          }),
          prisma.order.update({
            where: { id: newOrder.id },
            data: { status: "FAILED", note: "Provider Error" },
          }),
        ]);

        res
          .status(500)
          .json({
            message: "Gagal memproses ke provider. Saldo dikembalikan.",
          });
      }
    } catch (error) {
      console.error("Order Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server saat order." });
    }
  },

  // ==========================================
  // 2. RIWAYAT ORDER
  // ==========================================
  getMyOrders: async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 50, // Limit 50 transaksi terakhir biar ringan
      });

      res.json({ status: "success", data: orders });
    } catch (error) {
      console.error("Get Orders Error:", error);
      res.status(500).json({ message: "Gagal mengambil riwayat order." });
    }
  },

  // ==========================================
  // 3. DETAIL ORDER
  // ==========================================
  getOrderDetail: async (req, res) => {
    try {
      const { trxId } = req.params;

      const order = await prisma.order.findFirst({
        where: {
          trxId: trxId,
          userId: req.user.id, // Security: Pastikan hanya pemilik yang bisa lihat
        },
      });

      if (!order)
        return res.status(404).json({ message: "Transaksi tidak ditemukan." });

      res.json({ status: "success", data: order });
    } catch (error) {
      console.error("Order Detail Error:", error);
      res.status(500).json({ message: "Gagal mengambil detail order." });
    }
  },
};

module.exports = orderController;
