/**
 * Helper untuk standarisasi response API
 * Digunakan oleh Controller dan Middleware
 */
const responseHelper = {
  /**
   * Response Berhasil (200 OK)
   */
  success: (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  /**
   * Response Gagal (4xx, 5xx)
   */
  error: (res, message = "Internal Server Error", statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  },
};

module.exports = responseHelper;
