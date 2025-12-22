const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

// Pasang middleware di semua rute order
// Middleware ini akan mengecek token, tapi TIDAK menolak request jika token kosong (Guest mode)
// Kecuali untuk endpoint yang kita cek manual req.user-nya (seperti getMyOrders)
router.use(authMiddleware);

// POST /api/orders -> Buat Order (Guest / User)
router.post("/", orderController.createOrder);

// GET /api/orders/my-orders -> Riwayat Transaksi (Wajib Login)
router.get("/my-orders", orderController.getMyOrders);

// GET /api/orders/:orderId -> Cek Status (Public)
// PENTING: Taruh ini PALING BAWAH agar tidak bentrok dengan 'my-orders'
router.get("/:orderId", orderController.getOrderDetail);

module.exports = router;
