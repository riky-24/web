const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Memulai proses seeding data...");

  // 1. Buat Data Game: Mobile Legends
  const mobileLegends = await prisma.game.upsert({
    where: { slug: "mobile-legends" },
    update: {},
    create: {
      name: "Mobile Legends: Bang Bang",
      slug: "mobile-legends",
      category: "MOBA",
      publisher: "Moonton",
      image:
        "https://cdn.icon-icons.com/icons2/2699/PNG/512/mobile_legends_logo_icon_169344.png", // URL Gambar Dummy
      description: "Top up Diamond Mobile Legends resmi Moonton.",
      products: {
        create: [
          {
            name: "3 Diamonds",
            price: 1500, // Harga Jual (Markup sendiri)
            vipCode: "MLBB_3", // Kode dari VIP Reseller (Sesuaikan nanti)
          },
          {
            name: "86 Diamonds",
            price: 23000,
            vipCode: "MLBB_86",
          },
          {
            name: "172 Diamonds",
            price: 46000,
            vipCode: "MLBB_172",
          },
        ],
      },
    },
  });

  // 2. Buat Data Game: Free Fire (Contoh Kedua)
  const freeFire = await prisma.game.upsert({
    where: { slug: "free-fire" },
    update: {},
    create: {
      name: "Free Fire",
      slug: "free-fire",
      category: "Battle Royale",
      publisher: "Garena",
      image:
        "https://upload.wikimedia.org/wikipedia/en/d/db/Garena_Free_Fire_Logo.png",
      description: "Beli Diamond Free Fire aman dan legal.",
      products: {
        create: [
          {
            name: "5 Diamonds",
            price: 1000,
            vipCode: "FF_5",
          },
          {
            name: "70 Diamonds",
            price: 10000,
            vipCode: "FF_70",
          },
        ],
      },
    },
  });

  console.log(
    "[SEED] Berhasil menambahkan:",
    mobileLegends.name,
    "&",
    freeFire.name
  );
}

main()
  .catch((e) => {
    console.error("[SEED ERROR]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
