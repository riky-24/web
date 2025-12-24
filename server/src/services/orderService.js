const orderModel = require("../models/orderModel"); // Import Order Model
const gameModel = require("../models/gameModel"); // Import Game Model (untuk cek produk)
const midtransService = require("./midtransService");
const vipService = require("./vipResellerService");

const { serverKey } = require("../config/midtrans");
const { createSHA512, compareSafe } = require("../utils/cryptoHelper");
const { generateTrxId } = require("../utils/stringHelper");

const orderService = {
  /**
   * 1. MEMBUAT TRANSAKSI BARU
   */
  createTransaction: async (user, orderData) => {
    const { productId, gameUserId, zoneId, method } = orderData;

    // A. Validasi Product (Pakai gameModel)
    const product = await gameModel.findProductById(productId);

    if (!product) throw new Error("Produk tidak ditemukan.");

    // B. Generate ID Transaksi
    const trxId = generateTrxId();

    // C. Buat Record Order (Pakai orderModel)
    const newOrder = await orderModel.create({
      trxId: trxId,
      userId: user ? user.id : null,
      productId: product.id,
      playerId: gameUserId,
      serverZone: zoneId || "",
      amount: product.price,
      status: "pending",
      paymentMethod: method || "qris",
    });

    // D. Request Token ke Midtrans
    const itemDetails = [
      {
        id: product.id,
        price: product.price,
        quantity: 1,
        name: `${product.game.name} - ${product.name}`.substring(0, 50),
      },
    ];

    const customerDetails = {
      first_name: user ? user.username : "Guest User",
      email: user ? user.email : "guest@store.com",
    };

    const midtransData = await midtransService.createTransaction(
      newOrder.id,
      newOrder.amount,
      customerDetails,
      itemDetails
    );

    // F. Update Order dengan Token (Pakai orderModel)
    await orderModel.update(newOrder.id, {
      paymentUrl: midtransData.redirect_url,
      midtransTrxId: midtransData.token,
    });

    return {
      orderId: newOrder.id,
      trxId: newOrder.trxId,
      snapToken: midtransData.token,
      paymentUrl: midtransData.redirect_url,
    };
  },

  /**
   * 2. MEMPROSES NOTIFIKASI PEMBAYARAN
   */
  processPaymentNotification: async (notification) => {
    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
    } = notification;

    if (!order_id || !signature_key)
      throw new Error("Invalid Notification Body");

    // --- SECURITY CHECK ---
    const dataString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const mySignature = createSHA512(dataString);

    if (!compareSafe(signature_key, mySignature)) {
      console.warn(`[SECURITY ALERT] Invalid Signature for Order ${order_id}`);
      throw new Error("Invalid Signature!");
    }

    // --- CEK DATA ORDER (Pakai orderModel) ---
    const order = await orderModel.findById(order_id);

    if (!order) throw new Error("Order not found in database.");

    if (order.status === "success" || order.status === "processing") {
      return { status: "ignored", message: "Order already processed." };
    }

    // --- ANALISA STATUS ---
    let paymentSuccess = false;
    let newStatus = order.status;

    if (transaction_status === "capture") {
      if (fraud_status === "challenge") newStatus = "challenge";
      else if (fraud_status === "accept") paymentSuccess = true;
    } else if (transaction_status === "settlement") {
      paymentSuccess = true;
    } else if (["cancel", "deny", "expire"].includes(transaction_status)) {
      newStatus = "failed";
    }

    if (!paymentSuccess) {
      if (newStatus !== order.status) {
        await orderModel.update(order_id, { status: newStatus });
      }
      return { status: "updated", message: `Status updated to ${newStatus}` };
    }

    // --- EKSEKUSI KE PROVIDER ---
    await orderModel.update(order_id, { status: "processing" });
    console.log(`[ORDER] Processing Topup for ${order.trxId}`);

    try {
      const trxVip = await vipService.transaction(
        order.trxId,
        order.product.vipCode,
        order.playerId,
        order.serverZone
      );

      if (trxVip.result) {
        await orderModel.update(order_id, {
          status: "success",
          vipTrxId: trxVip.data.trxid,
          note: "Transaction Success",
        });
        return { status: "success", message: "Order fulfilled successfully." };
      } else {
        console.error(
          `[PROVIDER FAIL] Order ${order.trxId}: ${trxVip.message}`
        );
        await orderModel.update(order_id, {
          status: "manual_check",
          note: `Provider Error: ${trxVip.message}`,
        });
        return {
          status: "error",
          message: "Payment success but Provider failed.",
        };
      }
    } catch (error) {
      console.error("[EXECUTION ERROR]", error);
      await orderModel.update(order_id, {
        status: "manual_check",
        note: "System Error during fulfillment",
      });
      throw error;
    }
  },

  getUserHistory: async (userId) => {
    return await orderModel.findByUserId(userId);
  },

  getOrderDetail: async (orderId, userId = null) => {
    const order = await orderModel.findById(orderId);
    if (!order) return null;
    if (userId && order.userId !== userId)
      throw new Error("Unauthorized access to order detail.");
    return order;
  },
};

module.exports = orderService;
