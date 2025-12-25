const loginService = require("../services/loginService");
const logger = require("../utils/logger");
// [BARU] Import Kamus Baku biar pesan konsisten
const { MESSAGES } = require("../config/constants");

const loginController = {
  // Pintu 1: Cek Password
  initiate: async (req, res) => {
    try {
      const { email, password } = req.body;
      // Oper IP Address untuk keperluan log forensik & rate limit
      const result = await loginService.initiate(email, password, req.ip);

      // Skenario A: Dicegat MFA (Admin/Risk User)
      if (result.status === "MFA_REQUIRED") {
        logger.info(`MFA Challenge for ${email}`, "LoginFlow");

        return res.status(200).json({
          status: "success",
          // [FIX] Gunakan pesan dari constants
          message:
            MESSAGES.AUTH.MFA_REQUIRED || "Verifikasi tambahan diperlukan.",
          data: {
            needMfa: true,
            preAuthToken: result.preAuthToken, // Tiket masuk ruang tunggu
          },
        });
      }

      // Skenario B: Lolos Langsung
      return response.success(
        res,
        { token: result.token, user: result.user },
        "Login berhasil."
      );
    } catch (error) {
      // Log error system ke file (biar admin tau)
      logger.error("Login Initiate Error", error);

      // Balas ke user dengan 401 (Unauthorized)
      // Jangan kasih detail error 500 ke user, cukup pesan aman
      return response.error(res, error.message, 401);
    }
  },

  // Pintu 2: Cek Kode OTP
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
        { token: result.token, user: result.user },
        "Verifikasi MFA sukses. Selamat datang."
      );
    } catch (error) {
      logger.error("MFA Verify Error", error);
      return response.error(res, error.message, 401);
    }
  },
};

module.exports = loginController;
