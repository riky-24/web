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

  // [BARU] Handle Request Forgot Password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return response.error(res, "Email wajib diisi.", 400);

      // Kita tidak menunggu hasil email (fire and forget) atau tunggu sebentar
      await adminAuthService.requestPasswordReset(email);

      // Selalu balas Sukses demi keamanan (User Enumeration Protection)
      return response.success(
        res,
        null,
        "Jika email terdaftar, link reset telah dikirim."
      );
    } catch (error) {
      // Log error asli di server, tapi jangan kasih tahu user detailnya
      logger.error(`Reset Pass Error: ${error.message}`);
      return response.error(res, "Permintaan gagal diproses.");
    }
  },

  // [BARU] Handle Submit New Password
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return response.error(res, "Data tidak lengkap.", 400);
      }

      if (newPassword.length < 8) {
        return response.error(res, "Password minimal 8 karakter.", 400);
      }

      await adminAuthService.resetPassword(token, newPassword);

      return response.success(
        res,
        null,
        "Password berhasil diubah. Silakan login."
      );
    } catch (error) {
      return response.error(res, error.message, 400);
    }
  },
};

module.exports = adminAuthController;
