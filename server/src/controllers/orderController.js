const orderService = require("../services/orderService");
const response = require("../utils/responseHelper");
const logger = require("../utils/logger");

const orderController = {
  createOrder: async (req, res) => {
    try {
      const user = req.user || null;
      const orderData = req.body;

      if (!orderData.productId || !orderData.gameUserId) {
        return response.error(res, "Data pesanan tidak lengkap", 400);
      }

      const result = await orderService.createTransaction(user, orderData);

      logger.transaction(result.trxId, "PENDING", "Order Created");
      return response.success(res, result, "Order berhasil dibuat", 201);
    } catch (error) {
      logger.error("CreateOrder Error", error);
      const code = error.message.includes("tidak ditemukan") ? 404 : 500;
      return response.error(res, error.message, code);
    }
  },

  handleNotification: async (req, res) => {
    try {
      const notification = req.body;
      logger.info(`Webhook received for: ${notification.order_id}`, "Payment");

      await orderService.processPaymentNotification(notification);

      return response.success(res, null, "OK");
    } catch (error) {
      logger.error("Webhook Error", error);
      if (error.message.includes("Invalid Signature")) {
        return response.error(res, "Invalid Signature", 403);
      }
      return response.serverError(res, error);
    }
  },

  getMyOrders: async (req, res) => {
    try {
      const orders = await orderService.getUserHistory(req.user.id);
      return response.success(res, orders);
    } catch (error) {
      logger.error("GetMyOrders Error", error);
      return response.serverError(res, error);
    }
  },

  getOrderDetail: async (req, res) => {
    try {
      const order = await orderService.getOrderDetail(
        req.params.orderId,
        req.user ? req.user.id : null
      );
      if (!order) return response.error(res, "Order tidak ditemukan", 404);
      return response.success(res, order);
    } catch (error) {
      logger.error("GetOrderDetail Error", error);
      const code = error.message.includes("Unauthorized") ? 403 : 500;
      return response.error(res, error.message, code);
    }
  },
};

module.exports = orderController;
