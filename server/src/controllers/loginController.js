const loginService = require("../services/loginService");
const response = require("../utils/responseHelper");
const logger = require("../utils/logger");

const loginController = {
  // Handle Login Awal
  initiate: async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await loginService.initiate(email, password, req.ip);

      // Skenario 1: Kena MFA
      if (result.status === "MFA_REQUIRED") {
        logger.info(`MFA Challenge for ${email}`, "LoginFlow");
        return res.status(200).json({
          status: "success",
          message: "Verifikasi tambahan diperlukan.",
          data: {
            needMfa: true,
            preAuthToken: result.preAuthToken,
          },
        });
      }

      // Skenario 2: Login Sukses
      return response.success(
        res,
        {
          token: result.token,
          user: result.user,
        },
        "Login berhasil"
      );
    } catch (error) {
      logger.error("Login Error", error);
      return response.error(res, error.message, 401);
    }
  },

  // Handle Input Kode OTP
  verifyMfa: async (req, res) => {
    try {
      const { preAuthToken, mfaCode } = req.body;
      const result = await loginService.verifyMfa(
        preAuthToken,
        mfaCode,
        req.ip
      );

      return response.success(
        res,
        {
          token: result.token,
          user: result.user,
        },
        "Verifikasi MFA sukses."
      );
    } catch (error) {
      logger.error("MFA Verify Error", error);
      return response.error(res, error.message, 401);
    }
  },
};

module.exports = loginController;
