const vipService = require("../services/vipResellerService");

const gameController = {
  // ==========================================
  // 1. GET ALL GAMES (List Game)
  // ==========================================
  getGames: async (req, res) => {
    try {
      // Ambil daftar game dari cache atau provider
      // (Contoh logic sederhana)
      const games = await vipService.getGameList();

      // Di sini kita bisa filter game yang sedang gangguan, dll.
      res.json({ status: "success", data: games });
    } catch (error) {
      console.error("Get Games Error:", error);
      res.status(500).json({ message: "Gagal memuat daftar game." });
    }
  },

  // ==========================================
  // 2. GET GAME DETAIL (Penting: Pricing Logic)
  // ==========================================
  getGameDetail: async (req, res) => {
    try {
      const { slug } = req.params; // misal: 'mobile-legends'

      // 1. Ambil Data Produk dari Provider
      const gameData = await vipService.getGameDetail(slug);

      if (!gameData) {
        return res.status(404).json({ message: "Game tidak ditemukan." });
      }

      // 2. LOGIKA HARGA DINAMIS (Impact dari AuthMiddleware)
      // Cek apakah user sedang login dan punya role khusus
      const userRole = req.user ? req.user.role : "GUEST";

      const productsWithPrice = gameData.products.map((item) => {
        let finalPrice = item.price;

        // Aturan Margin
        if (userRole === "RESELLER") {
          finalPrice = item.price * 1.02; // Untung tipis 2% buat Reseller
        } else if (userRole === "VIP") {
          finalPrice = item.price * 1.03; // Untung 3% buat VIP
        } else {
          finalPrice = item.price * 1.05; // Untung 5% buat User Biasa / Guest
        }

        return {
          ...item,
          price: Math.ceil(finalPrice), // Pembulatan harga
          originalPrice: undefined, // HAPUS harga modal agar tidak bocor ke publik!
        };
      });

      res.json({
        status: "success",
        data: {
          name: gameData.name,
          slug: gameData.slug,
          products: productsWithPrice,
        },
      });
    } catch (error) {
      console.error("Game Detail Error:", error);
      res.status(500).json({ message: "Gagal memuat detail game." });
    }
  },
};

module.exports = gameController;
