const { prisma } = require("../config/database");
const logger = require("../utils/logger");

const logModel = {
  /**
   * PENCATATAN FORENSIK
   * Menyimpan log ke Database (AuditLog) DAN File System.
   */
  create: async (data) => {
    const { action, userId, details, ipAddress, level = "info" } = data;

    try {
      // 1. TULIS KE FILE (FORENSIK)
      const logMessage = `[${action}] ${details} | IP: ${
        ipAddress || "Unknown"
      } | UserID: ${userId || "Guest"}`;

      if (level === "error") logger.error(logMessage);
      else if (level === "warn") logger.warn(logMessage);
      else logger.info(logMessage);

      // 2. SIMPAN KE DATABASE (Akses Admin)
      // [FIX] Gunakan 'auditLog' sesuai schema.prisma Bos
      await prisma.auditLog.create({
        data: {
          action,
          userId,
          details,
          ipAddress,
          isSuspicious: level === "warn" || level === "error", // [BONUS] Auto-flag suspicious
          createdAt: new Date(),
        },
      });
    } catch (error) {
      logger.error(`[LOG_FAILURE] Gagal menyimpan log ke DB: ${error.message}`);
    }
  },

  // Fungsi baca log untuk Admin Panel
  getLogs: async (limit = 100) => {
    // [FIX] Gunakan 'auditLog'
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { email: true, username: true } } },
    });
  },
};

module.exports = logModel;
