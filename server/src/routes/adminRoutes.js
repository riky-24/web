const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");

// Middleware Global untuk Route ini: Login & Admin Only
router.use(requireAuth, requireAdmin);

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================

// GET /api/admin/dashboard -> Cek statistik & saldo VIP
router.get("/dashboard", adminController.getDashboard);

// GET /api/admin/transactions -> Pantau semua order
router.get("/transactions", adminController.getAllTransactions);

// ==========================================
// SYSTEM CONFIGURATION
// ==========================================

// GET /api/admin/config -> Cek margin saat ini
router.get("/config", adminController.getSystemConfig);

// PUT /api/admin/config -> Update margin/maintenance mode
router.put("/config", adminController.updateSystemConfig);

module.exports = router;
