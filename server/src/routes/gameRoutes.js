const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

// GET /api/games -> List semua game
router.get("/", gameController.getAllGames);

// GET /api/games/:slug -> Detail game + produk (misal: /api/games/mobile-legends)
router.get("/:slug", gameController.getGameDetail);
// Rute Baru: POST /api/games/check-id
router.post("/check-id", gameController.checkAccount);

module.exports = router;
