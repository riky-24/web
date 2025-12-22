const { prisma } = require("../config/database");
const vipService = require("../services/vipResellerService");

const gameController = {
  // 1. Ambil Semua List Game
  getAllGames: async (req, res) => {
    try {
      const games = await prisma.game.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          category: true,
        },
      });
      res.json({ status: "success", data: games });
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", message: "Gagal mengambil data game" });
    }
  },

  // 2. Ambil Detail Game + Produk
  getGameDetail: async (req, res) => {
    const { slug } = req.params;
    try {
      const game = await prisma.game.findUnique({
        where: { slug },
        include: {
          products: {
            where: { isActive: true },
            orderBy: { price: "asc" },
          },
        },
      });

      if (!game)
        return res
          .status(404)
          .json({ status: "error", message: "Game tidak ditemukan" });

      res.json({ status: "success", data: game });
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", message: "Gagal mengambil detail game" });
    }
  },

  // 3. FITUR BARU: Cek ID Player (Validasi Akun)
  checkAccount: async (req, res) => {
    try {
      const { slug, userId, zoneId } = req.body;

      // Validasi Input Dasar
      if (!slug || !userId) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "Slug Game dan User ID wajib diisi",
          });
      }

      // Panggil Service VIP Reseller
      // slug di DB kita (misal 'mobile-legends') sama dengan kode di VIP Reseller
      const result = await vipService.checkGameId(slug, userId, zoneId);

      // Cek respon dari VIP Reseller
      if (result.result === false) {
        return res.status(400).json({
          status: "error",
          message: result.message || "ID Player tidak ditemukan",
        });
      }

      // Sukses
      res.json({
        status: "success",
        data: {
          username: result.data.userName || result.data, // Sesuaikan dengan response real VIP
          originalResponse: result, // Debugging
        },
      });
    } catch (error) {
      console.error("[CheckAccount Error]", error.message);
      res
        .status(500)
        .json({ status: "error", message: "Gagal mengecek ID Player" });
    }
  },
};

module.exports = gameController;
