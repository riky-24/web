const crypto = require("crypto");

const cryptoHelper = {
  /**
   * Membuat Hash MD5 (Digunakan untuk Signature VIP Reseller)
   * @param {string} data - String yang akan di-hash
   */
  createMD5: (data) => {
    return crypto.createHash("md5").update(data).digest("hex");
  },

  /**
   * Membuat Hash SHA512 (Digunakan untuk Signature Midtrans)
   * @param {string} data - String yang akan di-hash
   */
  createSHA512: (data) => {
    return crypto.createHash("sha512").update(data).digest("hex");
  },

  /**
   * Membandingkan dua signature secara aman (Anti-Timing Attack)
   * Digunakan saat memvalidasi webhook Midtrans
   */
  compareSafe: (signature1, signature2) => {
    try {
      const buf1 = Buffer.from(signature1);
      const buf2 = Buffer.from(signature2);

      // Pastikan panjang buffer sama sebelum compare (atau timingSafeEqual akan throw error)
      if (buf1.length !== buf2.length) return false;

      return crypto.timingSafeEqual(buf1, buf2);
    } catch (error) {
      return false;
    }
  },

  /**
   * Generate Random Token (Hex)
   * Digunakan untuk Email Verification & Reset Password
   */
  generateRandomToken: (bytes = 32) => {
    return crypto.randomBytes(bytes).toString("hex");
  },
};

module.exports = cryptoHelper;
