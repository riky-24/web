const validationMiddleware = {
  // Validasi Payload Register
  validateRegister: (req, res, next) => {
    const { name, email, password } = req.body;

    // 1. Cek Kekosongan
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Semua kolom wajib diisi!" });
    }

    // 2. Cek Karakter Nama (Anti XSS/Injection basic)
    const safeNameRegex = /^[a-zA-Z0-9\s.,'-]+$/;
    if (!safeNameRegex.test(name)) {
      return res
        .status(400)
        .json({ message: "Nama mengandung karakter yang tidak diizinkan!" });
    }

    // 3. Cek Panjang Password
    if (password.length < 8) {
      return res.status(400).json({ message: "Password minimal 8 karakter!" });
    }

    next();
  },

  // Validasi Payload Reset Password
  validateResetPassword: (req, res, next) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Semua data wajib diisi!" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Konfirmasi password tidak cocok!" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password minimal 8 karakter!" });
    }

    next();
  },
};

module.exports = validationMiddleware;
