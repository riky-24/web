const adminAuthService = require("../services/adminAuthService");
const response = require("../utils/responseHelper");
const logger = require("../utils/logger");

/**
 * Controller Autentikasi Admin
 * Memastikan alur login 2 tahap (Password & MFA)
 *
 */
const adminAuthController = {
  // TAHAP 1: Inisiasi Login (Cek Password)
  //
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await adminAuthService.initiate(email, password, req.ip);

      if (result.status === "MFA_REQUIRED") {
        return res.status(200).json({
          success: true,
          message: "Kredensial benar. Silakan masukkan kode OTP.",
          data: {
            mfaRequired: true,
            preAuthToken: result.preAuthToken,
          },
        });
      }
    } catch (error) {
      logger.error(`Admin Login Fail: ${error.message}`);
      return response.error(res, error.message, 401);
    }
  },

  // TAHAP 2: Verifikasi OTP
  //
  verifyOtp: async (req, res) => {
    try {
      const { preAuthToken, otpCode } = req.body;
      const result = await adminAuthService.verifyMfa(
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
