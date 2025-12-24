const { prisma } = require("../config/database");

const gameModel = {
  // Ambil semua game yang aktif untuk ditampilkan di Home
  findAllActive: async () => {
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

  // Ambil detail game lengkap dengan produknya (diurutkan harga termurah)
  findBySlug: async (slug) => {
    return await prisma.game.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });
  },

  // Cari Produk spesifik berdasarkan ID (Penting untuk validasi saat Checkout)
  findProductById: async (id) => {
    return await prisma.product.findUnique({
      where: { id },
      include: { game: true },
    });
  },
};

module.exports = gameModel;
