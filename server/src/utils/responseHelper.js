const responseHelper = {
  /**
   * 200/201: Respon Sukses
   */
  success: (res, data = null, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
      status: "success",
      message: message,
      data: data,
    });
  },

  /**
   * 400/404/422: Error Client (Salah Input, Data Tidak Ada)
   */
  error: (res, message = "Something went wrong", statusCode = 400) => {
    return res.status(statusCode).json({
      status: "error",
      message: message,
    });
  },

  /**
   * 500: Error Server (Crash/Bug)
   * Menyembunyikan detail error di production agar aman
   */
  serverError: (res, error) => {
    const message = "Terjadi kesalahan internal pada server.";
    const errorDetail =
      process.env.NODE_ENV === "development" ? error.message : undefined;

    return res.status(500).json({
      status: "error",
      message: message,
      debug: errorDetail, // Hanya muncul di mode dev
    });
  },
};

module.exports = responseHelper;
