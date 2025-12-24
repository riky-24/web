const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const { optionalAuth } = require("../middlewares/authMiddleware");

// ==========================================
// PUBLIC ROUTES (Dengan Optional Auth)
// ==========================================

// GET /api/games
// Mengambil semua list game (Public)
router.get("/", gameController.getAllGames);

// GET /api/games/:slug
// Mengambil detail game & produk
// PENTING: Pakai 'optionalAuth' agar Controller tau ini Guest atau Member (untuk harga dinamis)
router.get("/:slug", optionalAuth, gameController.getGameDetail);

// POST /api/games/check-id
// Cek Validitas ID Player ke Provider (Public)
router.post("/check-id", gameController.checkAccount);

module.exports = router;
