const gameModel = require("../models/gameModel"); // Import Model
const vipService = require("./vipResellerService");

const gameService = {
  /**
   * Mengambil semua daftar game yang aktif.
   */
  getAllGames: async () => {
    // Panggil Model, bukan Prisma langsung
    return await gameModel.findAllActive();
  },

  /**
   * Mengambil detail game beserta produknya.
   * [LOGIC BISNIS] Melakukan perhitungan markup harga di sini.
   */
  getGameDetail: async (slug, role = "GUEST") => {
    // 1. Ambil data dari Model
    const game = await gameModel.findBySlug(slug);

    if (!game) return null;

    // 2. Tentukan Margin Profit berdasarkan Role
    let margin = 0.05; // Default User/Guest: 5%

    if (role === "RESELLER") {
      margin = 0.02; // Reseller: 2%
    } else if (role === "VIP") {
      margin = 0.03; // VIP: 3%
    }

    // 3. Mapping Produk dengan Harga Baru (Menyembunyikan Harga Modal)
    const productsWithPublicPrice = game.products.map((product) => {
      const sellingPrice = Math.ceil(product.price * (1 + margin));

      return {
        id: product.id,
        name: product.name,
        price: sellingPrice,
        icon: product.icon,
        // vipCode dan originalPrice tidak diteruskan ke frontend
      };
    });

    return {
      ...game,
      products: productsWithPublicPrice,
    };
  },

  /**
   * Memvalidasi ID Player ke Provider.
   */
  validateGameAccount: async (slug, userId, zoneId = "") => {
    return await vipService.checkGameId(slug, userId, zoneId);
  },
};

module.exports = gameService;
