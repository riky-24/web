const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { requireAuth } = require("../middlewares/authMiddleware");

// ==========================================
// PROTECTED ROUTES (Wajib Login)
// ==========================================

// POST /api/orders
// Buat pesanan baru
router.post("/", requireAuth, orderController.createOrder);

// GET /api/orders
// Lihat riwayat pesanan sendiri
router.get("/", requireAuth, orderController.getMyOrders);

// GET /api/orders/:orderId
// Lihat detail satu pesanan
router.get("/:orderId", requireAuth, orderController.getOrderDetail);

// ==========================================
// PUBLIC ROUTES (Webhook Midtrans)
// ==========================================

// POST /api/orders/notification
// Webhook dari Midtrans (Jangan dikasih Auth! Midtrans gak punya token login kita)
// Keamanan dijaga oleh Signature Key check di dalam Controller/Service.
router.post("/notification", orderController.handleNotification);

module.exports = router;
