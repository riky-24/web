const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
// IMPORT YANG BENAR (Ambil kedua fungsi)
const {
  authMiddleware,
  authenticateToken,
} = require("../middlewares/authMiddleware");

// =========================================================================
// 1. WEBHOOK NOTIFIKASI (PUBLIC)
// =========================================================================
// Tidak boleh kena middleware apapun karena dipanggil oleh Server Midtrans
router.post("/notification", orderController.handleNotification);

// =========================================================================
// 2. GLOBAL MIDDLEWARE (SOFT CHECK)
// =========================================================================
// Cek token di semua request ke bawah. Kalau valid, req.user terisi.
router.use(authMiddleware);

// =========================================================================
// 3. ROUTES
// =========================================================================

// Buat Pesanan (Bisa Guest / User)
router.post("/", orderController.createOrder);

// Riwayat Transaksi (WAJIB LOGIN - Pakai authenticateToken)
// Ini yang bikin error tadi karena authenticateToken belum didefinisikan
router.get("/my-orders", authenticateToken, orderController.getMyOrders);

// Cek Detail Order (Bisa Guest / User)
router.get("/:orderId", orderController.getOrderDetail);

module.exports = router;
