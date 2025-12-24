const authService = require("../services/authService");
const response = require("../utils/responseHelper");
const logger = require("../utils/logger");

const authController = {
  register: async (req, res) => {
    try {
      const payload = { ...req.body, ipAddress: req.ip };
      await authService.register(payload);
      return response.success(
        res,
        null,
        "Registrasi berhasil! Cek email untuk verifikasi.",
        201
      );
    } catch (error) {
      logger.error("Register Error", error);
      return response.serverError(res, error);
    }
  },

  login: async (req, res) => {
    try {
      const payload = { ...req.body, ipAddress: req.ip };
      const result = await authService.login(payload);
      return response.success(res, result, "Login berhasil");
    } catch (error) {
      logger.error("Login Error", error);
      // Return 400/401 untuk error login
      return response.error(res, error.message, 401);
    }
  },

  verifyEmail: async (req, res) => {
    try {
      await authService.verifyEmail(req.body.token);
      return response.success(
        res,
        null,
        "Email berhasil diverifikasi! Silakan login."
      );
    } catch (error) {
      logger.error("Verify Error", error);
      return response.error(res, error.message, 400);
    }
  },

  forgotPassword: async (req, res) => {
    try {
      await authService.forgotPassword(req.body.email);
      return response.success(
        res,
        null,
        "Jika email terdaftar, link reset telah dikirim."
      );
    } catch (error) {
      logger.error("Forgot Password Error", error);
      return response.serverError(res, error);
    }
  },

  resetPassword: async (req, res) => {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      return response.success(
        res,
        null,
        "Password berhasil diubah! Silakan login."
      );
    } catch (error) {
      logger.error("Reset Password Error", error);
      return response.error(res, error.message, 400);
    }
  },
};

module.exports = authController;
