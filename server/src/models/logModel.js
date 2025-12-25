const { prisma } = require("../config/database");
const logger = require("../utils/logger");

const logModel = {
  /**
   * PENCATATAN FORENSIK
   * Menyimpan log ke Database DAN File System secara bersamaan.
   * * @param {Object} data
   * @param {string} data.action - Jenis aksi (contoh: "AUTH_LOGIN", "AUTH_FAIL")
   * @param {string} data.userId - ID User (jika ada)
   * @param {string} data.details - Keterangan detail
   * @param {string} data.ipAddress - IP Pelaku
   * @param {string} data.level - 'info' | 'warn' | 'error' (Default: info)
   */
  create: async (data) => {
    const { action, userId, details, ipAddress, level = "info" } = data;

    try {
      // 1. TULIS KE FILE (FORENSIK)
      // Format: [ACTION] Details | IP: ... | User: ...
      const logMessage = `[${action}] ${details} | IP: ${
        ipAddress || "Unknown"
      } | UserID: ${userId || "Guest"}`;

      if (level === "error") logger.error(logMessage);
      else if (level === "warn") logger.warn(logMessage);
      else logger.info(logMessage);

      // 2. SIMPAN KE DATABASE (Akses Admin)
      // Kita pakai try-catch terpisah agar jika DB mati, File tetap mencatat (Fail-Safe)
      await prisma.log.create({
        data: {
          action,
          userId,
          details,
          ipAddress,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      // Jika DB gagal, minimal kita punya catatan di file error log
      logger.error(`[LOG_FAILURE] Gagal menyimpan log ke DB: ${error.message}`);
    }
  },

  // Fungsi baca log (untuk Admin Panel nanti)
  getLogs: async (limit = 100) => {
    return await prisma.log.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { email: true, username: true } } },
    });
  },
};

module.exports = logModel;
