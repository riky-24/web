const adminService = require("../services/adminService");
const response = require("../utils/responseHelper");
const logger = require("../utils/logger");

const adminController = {
  // 1. DASHBOARD (Statistik & Saldo Provider)
  getDashboard: async (req, res) => {
    try {
      const stats = await adminService.getDashboardStats();
      return response.success(
        res,
        stats,
        "Dashboard data fetched successfully"
      );
    } catch (error) {
      logger.error("Admin Dashboard Error", error);
      return response.serverError(res, error);
    }
  },

  // 2. PANTAU TRANSAKSI (Semua User)
  getAllTransactions: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status || null;

      const result = await adminService.getAllTransactions(page, limit, status);
      return response.success(res, result);
    } catch (error) {
      logger.error("Admin Transactions Error", error);
      return response.serverError(res, error);
    }
  },

  // 3. GET CONFIG SYSTEM (Lihat Margin Saat Ini)
  getSystemConfig: async (req, res) => {
    try {
      const config = await adminService.getSystemConfig();
      return response.success(res, config);
    } catch (error) {
      logger.error("Get Config Error", error);
      return response.serverError(res, error);
    }
  },

  // 4. UPDATE CONFIG SYSTEM (Ubah Margin/Maintenance Mode)
  updateSystemConfig: async (req, res) => {
    try {
      const configData = req.body; // { marginUser: 0.1, isMaintenance: true, ... }

      // Validasi simpel biar ga asal input
      if (
        typeof configData.marginUser !== "undefined" &&
        configData.marginUser < 0
      ) {
        return response.error(res, "Margin tidak boleh negatif", 400);
      }

      const updatedConfig = await adminService.updateSystemConfig(configData);

      logger.warn(
        `System Config updated by Admin: ${req.user.email}`,
        "AdminAction"
      );

      return response.success(
        res,
        updatedConfig,
        "Konfigurasi sistem berhasil diperbarui"
      );
    } catch (error) {
      logger.error("Update Config Error", error);
      return response.serverError(res, error);
    }
  },
};

module.exports = adminController;
