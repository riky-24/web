const adminAuthService = require("../services/adminAuthService");
const response = require("../utils/responseHelper");
const logger = require("../utils/logger");

const adminAuthController = {
  // Handle Login Tahap 1
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await adminAuthService.initiateLogin(
        email,
        password,
        req.ip
      );

      if (result.status === "MFA_REQUIRED") {
        return res.status(200).json({
          success: true,
          message: "Kredensial benar. Masukkan kode MFA.",
          data: { mfaRequired: true, preAuthToken: result.preAuthToken },
        });
      }
    } catch (error) {
      logger.error(`Admin Login Fail: ${error.message}`);
      return response.error(res, error.message, 401);
    }
  },

  // Handle Verifikasi OTP
  verifyMfa: async (req, res) => {
    try {
      const { preAuthToken, otpCode } = req.body;
      const result = await adminAuthService.verifyAdminMfa(
        preAuthToken,
        otpCode,
        req.ip
      );

      return response.success(res, result, "Selamat Datang, Admin.");
    } catch (error) {
      return response.error(res, error.message, 401);
    }
  },
};

module.exports = adminAuthController;
