const { prisma } = require("../config/database");

const startCleanupJob = () => {
  // Jalankan setiap 1 jam (3600000 ms)
  // Anda bisa ubah intervalnya sesuai kebutuhan
  setInterval(async () => {
    try {
      console.log("🧹 [Cleanup] Sedang mencari akun zombie...");

      // Batas waktu: 1 Jam yang lalu
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Cari & Hapus user yang belum verifikasi lebih dari 1 jam
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          isVerified: false,
          createdAt: {
            lt: oneHourAgo, // 'lt' artinya Less Than (Lebih lama dari 1 jam lalu)
          },
        },
      });

      if (deletedUsers.count > 0) {
        console.log(
          `🗑️ [Cleanup] Berhasil menghapus ${deletedUsers.count} akun zombie/spam.`
        );
      } else {
        console.log("✨ [Cleanup] Tidak ada akun zombie. Database bersih.");
      }
    } catch (error) {
      console.error("⚠️ [Cleanup Error]:", error);
    }
  }, 3600000); // 3.6 Juta ms = 1 Jam
};

module.exports = { startCleanupJob };
