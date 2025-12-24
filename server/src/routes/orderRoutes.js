const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Import nama baru
const { requireAuth } = require("../middlewares/authMiddleware");

// Semua rute order wajib login
router.post("/", requireAuth, orderController.createOrder);
router.get("/", requireAuth, orderController.getMyOrders);
router.get("/:trxId", requireAuth, orderController.getOrderDetail);

module.exports = router;
