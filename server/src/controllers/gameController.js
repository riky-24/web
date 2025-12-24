const gameService = require("../services/gameService");

const gameController = {
  // 1. Ambil Semua List Game
  getAllGames: async (req, res) => {
    try {
      const games = await gameService.getAllGames();
      res.json({ status: "success", data: games });
    } catch (error) {
      console.error("[Controller] GetAllGames Error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Gagal mengambil data game" });
    }
  },

  // 2. Ambil Detail Game (Support Dynamic Pricing)
  getGameDetail: async (req, res) => {
    try {
      const { slug } = req.params;

      // Deteksi Role user dari token (Middleware Auth)
      // Jika user belum login, req.user undefined, default jadi GUEST di service
      const role = req.user ? req.user.role : "GUEST";

      const game = await gameService.getGameDetail(slug, role);

      if (!game) {
        return res
          .status(404)
          .json({ status: "error", message: "Game tidak ditemukan" });
      }

      res.json({ status: "success", data: game });
    } catch (error) {
      console.error("[Controller] GetGameDetail Error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Gagal mengambil detail game" });
    }
  },

  // 3. Cek ID Player
  checkAccount: async (req, res) => {
    try {
      const { slug, userId, zoneId } = req.body;

      if (!slug || !userId) {
        return res
          .status(400)
          .json({ status: "error", message: "Data tidak lengkap" });
      }

      const result = await gameService.validateGameAccount(
        slug,
        userId,
        zoneId
      );

      if (result.result === false) {
        return res.status(400).json({
          status: "error",
          message: result.message || "ID Player tidak ditemukan",
        });
      }

      res.json({
        status: "success",
        data: {
          username: result.data.userName || result.data,
          originalResponse: result, // Opsional debug
        },
      });
    } catch (error) {
      console.error("[Controller] CheckAccount Error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Gagal mengecek ID Player" });
    }
  },
};

module.exports = gameController;
