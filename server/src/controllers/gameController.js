const gameService = require("../services/gameService");
const response = require("../utils/responseHelper");
const logger = require("../utils/logger");

const gameController = {
  getAllGames: async (req, res) => {
    try {
      const games = await gameService.getAllGames();
      return response.success(res, games);
    } catch (error) {
      logger.error("GetAllGames Error", error);
      return response.serverError(res, error);
    }
  },

  getGameDetail: async (req, res) => {
    try {
      const role = req.user ? req.user.role : "GUEST";
      const game = await gameService.getGameDetail(req.params.slug, role);

      if (!game) return response.error(res, "Game tidak ditemukan", 404);
      return response.success(res, game);
    } catch (error) {
      logger.error("GetGameDetail Error", error);
      return response.serverError(res, error);
    }
  },

  checkAccount: async (req, res) => {
    try {
      const { slug, userId, zoneId } = req.body;
      if (!slug || !userId)
        return response.error(res, "Data tidak lengkap", 400);

      const result = await gameService.validateGameAccount(
        slug,
        userId,
        zoneId
      );

      if (result.result === false) {
        return response.error(
          res,
          result.message || "ID Player tidak ditemukan",
          400
        );
      }

      return response.success(res, {
        username: result.data.userName || result.data,
        originalResponse: result,
      });
    } catch (error) {
      logger.error("CheckAccount Error", error);
      return response.serverError(res, error);
    }
  },
};

module.exports = gameController;
