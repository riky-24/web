const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

// Import nama baru
const { optionalAuth } = require("../middlewares/authMiddleware");

// Gunakan optionalAuth agar user login bisa dapat harga khusus (jika ada fitur itu)
// GET /api/games
router.get("/", optionalAuth, gameController.getGames);

// GET /api/games/:slug
router.get("/:slug", optionalAuth, gameController.getGameDetail);

module.exports = router;
