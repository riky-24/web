const loginMiddleware = {
  // Validasi Input Tahap 1
  validateInitiate: (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return response.error(res, "Email dan Password wajib diisi.", 400);
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return response.error(res, "Format email tidak valid.", 400);
    }

    next();
  },

  // Validasi Input Tahap 2 (MFA)
  validateMfa: (req, res, next) => {
    const { preAuthToken, mfaCode } = req.body;

    if (!preAuthToken || !mfaCode) {
      return response.error(res, "Token sesi dan Kode MFA wajib diisi.", 400);
    }

    next();
  },
};

module.exports = loginMiddleware;
