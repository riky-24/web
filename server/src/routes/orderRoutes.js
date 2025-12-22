const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

// =========================================================================
// 1. WEBHOOK NOTIFIKASI (WAJIB PALING ATAS & PUBLIC)
// =========================================================================
// Endpoint ini menerima sinyal dari Midtrans (Server-to-Server).
// Tidak membawa token user, jadi harus DIEKSEKUSI SEBELUM authMiddleware.
router.post("/notification", orderController.handleNotification);

// =========================================================================
// 2. MIDDLEWARE AUTHENTICATION
// =========================================================================
// Semua rute di bawah baris ini akan dicek token-nya.
// Jika user login, req.user akan terisi. Jika guest, req.user = null.
router.use(authMiddleware);

// =========================================================================
// 3. FITUR TRANSAKSI USER
// =========================================================================

// POST /api/orders -> Buat Pesanan Baru (Bisa User / Guest)
router.post("/", orderController.createOrder);

// GET /api/orders/my-orders -> Riwayat Transaksi Saya (Wajib Login)
// Controller 'getMyOrders' akan menolak jika req.user kosong.
router.get("/my-orders", orderController.getMyOrders);

// GET /api/orders/:orderId -> Cek Detail/Struk (Public)
// Ditaruh paling bawah agar tidak bentrok dengan path lain (seperti /notification)
router.get("/:orderId", orderController.getOrderDetail);

module.exports = router;
