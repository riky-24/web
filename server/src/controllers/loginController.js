const loginService = require("../services/loginService");
const response = require("../utils/responseHelper");
const logger = require("../utils/logger");
const { MESSAGES } = require("../config/constants");

const loginController = {
  // Pintu 1: Cek Password
  initiate: async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await loginService.initiate(email, password, req.ip);

      // Skenario: Kena MFA
      if (result.status === "MFA_REQUIRED") {
        logger.info(`Real MFA Challenge for ${email}`, "LoginFlow");
        return res.status(200).json({
          status: "success",
          message: MESSAGES.AUTH.MFA_REQUIRED,
          data: {
            needMfa: true,
            preAuthToken: result.preAuthToken,
          },
        });
      }

      // Skenario: Login Sukses
      return response.success(
        res,
        { token: result.token, user: result.user },
        "Login berhasil."
      );
    } catch (error) {
      logger.error("Login Error", error);
      // Gunakan 401 Unauthorized untuk semua kegagalan login (Security Practice)
      return response.error(res, error.message, 401);
    }
  },

  // Pintu 2: Cek Kode Authenticator
  verifyMfa: async (req, res) => {
    try {
      const { preAuthToken, mfaCode } = req.body;

      // Validasi input sederhana di controller
      if (!mfaCode || mfaCode.length < 6) {
        return response.error(res, "Kode harus 6 digit.", 400);
      }

      const result = await loginService.verifyMfa(
        preAuthToken,
        mfaCode,
        req.ip
      );

      return response.success(
        res,
        { token: result.token, user: result.user },
        "Verifikasi Dua Langkah Sukses."
      );
    } catch (error) {
      logger.error("MFA Verify Error", error);
      return response.error(res, error.message, 401);
    }
  },
};

module.exports = loginController;
