const orderService = require("../services/orderService");

const orderController = {
  // 1. BUAT PESANAN (User Checkout)
  createOrder: async (req, res) => {
    try {
      // req.user bisa ada (User) atau null (Guest)
      const user = req.user || null;
      const orderData = req.body; // { productId, gameUserId, zoneId, method }

      // Validasi input minimal di controller (tetap perlu, tapi simple saja)
      if (!orderData.productId || !orderData.gameUserId) {
        return res.status(400).json({ message: "Data pesanan tidak lengkap" });
      }

      const result = await orderService.createTransaction(user, orderData);

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      console.error("[Controller] CreateOrder Error:", error.message);
      // Tangkap error spesifik dari service jika ada (misal Product not found)
      const statusCode = error.message.includes("tidak ditemukan") ? 404 : 500;
      res.status(statusCode).json({ status: "error", message: error.message });
    }
  },

  // 2. WEBHOOK MIDTRANS (Sangat Bersih!)
  handleNotification: async (req, res) => {
    try {
      const notification = req.body;

      // Serahkan semua urusan validasi & update ke service
      await orderService.processPaymentNotification(notification);

      // Selalu return 200 ke Midtrans agar tidak dikirim ulang terus menerus
      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("[Controller] Webhook Error:", error.message);

      // Jika error karena signature, beri 403
      if (error.message.includes("Invalid Signature")) {
        return res.status(403).json({ message: "Invalid Signature" });
      }

      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // 3. RIWAYAT TRANSAKSI USER
  getMyOrders: async (req, res) => {
    try {
      // req.user.id dijamin ada oleh middleware requireAuth
      const orders = await orderService.getUserHistory(req.user.id);
      res.json({ status: "success", data: orders });
    } catch (error) {
      console.error("[Controller] MyOrders Error:", error);
      res.status(500).json({ message: "Gagal mengambil data transaksi." });
    }
  },

  // 4. DETAIL TRANSAKSI
  getOrderDetail: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user ? req.user.id : null; // Support admin/user view context

      const order = await orderService.getOrderDetail(orderId, userId);

      if (!order) {
        return res.status(404).json({ message: "Order tidak ditemukan" });
      }

      res.json({ status: "success", data: order });
    } catch (error) {
      console.error("[Controller] OrderDetail Error:", error.message);
      const statusCode = error.message.includes("Unauthorized") ? 403 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },
};

module.exports = orderController;
