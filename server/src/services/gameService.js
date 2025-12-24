const gameModel = require("../models/gameModel"); // Import Model
const vipService = require("./vipResellerService");
const adminService = require("./adminService");

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
    const game = await gameModel.findBySlug(slug);
    if (!game) return null;

    // [BARU] Ambil Margin dari Database System Config
    const config = await adminService.getSystemConfig();

    let margin = config.marginUser; // Default ambil dari DB

    if (role === "RESELLER") {
      margin = config.marginReseller;
    } else if (role === "VIP") {
      margin = config.marginVip;
    }

    // Mapping Produk dengan Harga Dinamis
    const productsWithPublicPrice = game.products.map((product) => {
      // Rumus: Harga Modal * (1 + Margin DB) + Biaya Layanan DB
      const serviceFee = config.serviceFee || 0;
      const sellingPrice = Math.ceil(product.price * (1 + margin) + serviceFee);

      return {
        id: product.id,
        name: product.name,
        price: sellingPrice,
        icon: product.icon,
      };
    });

    return {
      ...game,
      products: productsWithPublicPrice,
    };
  },
};

module.exports = gameService;
