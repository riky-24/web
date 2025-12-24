const orderService = require("../services/orderService");
const logger = require("../utils/logger");
const response = require("../utils/responseHelper");

const orderController = {
  // ==========================================
  // 1. BUAT PESANAN (User Checkout)
  // ==========================================
  createOrder: async (req, res) => {
    try {
      const user = req.user || null;
      const orderData = req.body;
      const userIdLog = user ? `User:${user.id}` : "Guest";

      logger.info(
        `Meminta pembuatan order baru oleh ${userIdLog}`,
        "OrderController"
      );

      // Validasi input minimal
      if (!orderData.productId || !orderData.gameUserId) {
        return response.error(
          res,
          "Data pesanan (Product ID / User ID) tidak lengkap",
          400
        );
      }

      const result = await orderService.createTransaction(user, orderData);

      logger.transaction(
        result.trxId,
        "PENDING",
        "Order created, waiting payment"
      );

      return response.success(res, result, "Order berhasil dibuat", 201);
    } catch (error) {
      logger.error("Gagal membuat order", error);

      // Handle error spesifik
      if (error.message.includes("tidak ditemukan")) {
        return response.error(res, error.message, 404);
      }
      return response.serverError(res, error);
    }
  },

  // ==========================================
  // 2. WEBHOOK MIDTRANS
  // ==========================================
  handleNotification: async (req, res) => {
    try {
      const notification = req.body;
      logger.info(
        `Menerima Webhook untuk OrderID: ${notification.order_id}`,
        "MidtransWebhook"
      );

      const result = await orderService.processPaymentNotification(
        notification
      );

      if (result.status === "error") {
        logger.warn(
          `Webhook processed with issue: ${result.message}`,
          "MidtransWebhook"
        );
      } else {
        logger.info(`Webhook processed: ${result.message}`, "MidtransWebhook");
      }

      // Selalu return 200 ke Midtrans agar tidak dikirim ulang
      return response.success(res, null, "Notification processed");
    } catch (error) {
      logger.error("Webhook Error", error);

      if (error.message.includes("Invalid Signature")) {
        return response.error(res, "Invalid Signature", 403);
      }

      // Tetap return 500 jika critical error
      return response.serverError(res, error);
    }
  },

  // ==========================================
  // 3. RIWAYAT TRANSAKSI USER
  // ==========================================
  getMyOrders: async (req, res) => {
    try {
      const orders = await orderService.getUserHistory(req.user.id);
      return response.success(res, orders, "Riwayat pesanan berhasil diambil");
    } catch (error) {
      logger.error(`Gagal mengambil history user ${req.user.id}`, error);
      return response.serverError(res, error);
    }
  },

  // ==========================================
  // 4. DETAIL TRANSAKSI
  // ==========================================
  getOrderDetail: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user ? req.user.id : null;

      const order = await orderService.getOrderDetail(orderId, userId);

      if (!order) {
        return response.error(res, "Order tidak ditemukan", 404);
      }

      return response.success(res, order, "Detail order ditemukan");
    } catch (error) {
      logger.error(`Gagal mengambil detail order ${req.params.orderId}`, error);

      if (error.message.includes("Unauthorized")) {
        return response.error(res, "Anda tidak berhak melihat order ini", 403);
      }
      return response.serverError(res, error);
    }
  },
};

module.exports = orderController;
