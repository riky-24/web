const { prisma } = require("../config/database");
const vipService = require("./vipResellerService");

const gameService = {
  /**
   * Mengambil semua daftar game yang aktif.
   * Hanya mengambil field penting untuk ditampilkan di halaman depan.
   */
  getAllGames: async () => {
    return await prisma.game.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        category: true,
      },
    });
  },

  /**
   * Mengambil detail game beserta produknya.
   * [LOGIC BISNIS] Melakukan perhitungan markup harga berdasarkan Role User.
   * @param {string} slug - Slug url game
   * @param {string} role - Role user (GUEST, USER, RESELLER, VIP)
   */
  getGameDetail: async (slug, role = "GUEST") => {
    // 1. Ambil data mentah dari Database
    const game = await prisma.game.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!game) return null;

    // 2. Tentukan Margin Profit berdasarkan Role
    // Rumus: Harga Modal * (1 + Margin)
    let margin = 0.05; // Default User/Guest: Untung 5%

    if (role === "RESELLER") {
      margin = 0.02; // Reseller: Untung 2%
    } else if (role === "VIP") {
      margin = 0.03; // VIP: Untung 3%
    }

    // 3. Mapping Produk dengan Harga Baru (Menyembunyikan Harga Modal)
    const productsWithPublicPrice = game.products.map((product) => {
      // Hitung harga jual
      const sellingPrice = Math.ceil(product.price * (1 + margin));

      return {
        id: product.id,
        name: product.name,
        price: sellingPrice, // Harga yang sudah dimarkup
        icon: product.icon,
        // Jangan return 'vipCode' atau 'originalPrice' ke frontend!
      };
    });

    // 4. Return data bersih
    return {
      ...game,
      products: productsWithPublicPrice,
    };
  },

  /**
   * Memvalidasi ID Player ke Provider (VIP Reseller).
   */
  validateGameAccount: async (slug, userId, zoneId = "") => {
    // Panggil service eksternal
    return await vipService.checkGameId(slug, userId, zoneId);
  },
};

module.exports = gameService;
