const { prisma } = require("../config/database");
const midtransService = require("../services/midtransService");

const orderController = {
  // 1. BUAT PESANAN (Create Order)
  createOrder: async (req, res) => {
    try {
      // req.user terisi otomatis oleh authMiddleware jika user login
      const userId = req.user ? req.user.id : null;

      const { productId, gameUserId, zoneId, method } = req.body;

      // Cek Produk
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { game: true },
      });
      if (!product)
        return res.status(404).json({ message: "Produk tidak ditemukan" });

      // Buat Order di Database
      const newOrder = await prisma.order.create({
        data: {
          userId: userId, // <-- SUDAH DINAMIS (Bisa ID User / Null)
          productId: product.id,
          playerId: gameUserId,
          serverZone: zoneId,
          amount: product.price,
          status: "pending",
          paymentMethod: method || "otomanis",
        },
      });

      // Siapkan Midtrans
      const itemDetails = [
        {
          id: product.id,
          price: product.price,
          quantity: 1,
          name: `${product.game.name} - ${product.name}`.substring(0, 50),
        },
      ];

      const customerDetails = {
        first_name: req.user ? req.user.role : "Guest", // Sekedar label
        email: req.user ? "user@registered.com" : "guest@example.com",
        phone: "08123456789",
      };

      // Minta Token Snap
      const midtransData = await midtransService.createTransaction(
        newOrder.id,
        newOrder.amount,
        customerDetails,
        itemDetails
      );

      // Simpan URL Pembayaran
      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          paymentUrl: midtransData.redirect_url,
          midtransTrxId: midtransData.token,
        },
      });

      res.json({
        status: "success",
        data: {
          orderId: newOrder.id,
          snapToken: midtransData.token,
          paymentUrl: midtransData.redirect_url,
        },
      });
    } catch (error) {
      console.error("[Create Order Error]", error);
      res
        .status(500)
        .json({ status: "error", message: "Gagal membuat pesanan" });
    }
  },

  // 2. CEK STATUS PESANAN (Public)
  getOrderDetail: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { product: { include: { game: true } } },
      });

      if (!order)
        return res.status(404).json({ message: "Order tidak ditemukan" });

      res.json({ status: "success", data: order });
    } catch (error) {
      res.status(500).json({ message: "Error server" });
    }
  },

  // 3. RIWAYAT TRANSAKSI SAYA (Protected)
  getMyOrders: async (req, res) => {
    try {
      // Pastikan user login
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: { product: { include: { game: true } } },
        orderBy: { createdAt: "desc" },
      });

      res.json({ status: "success", data: orders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal mengambil riwayat" });
    }
  },
};

module.exports = orderController;
