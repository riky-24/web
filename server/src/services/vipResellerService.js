const axios = require("axios");
const crypto = require("crypto");
const config = require("../config/vipreseller");

// Helper: Membuat Signature MD5 (API ID + API KEY)
const generateSignature = () => {
  // 1. Validasi: Pastikan Config ada
  if (!config.apiId || !config.apiKey) {
    throw new Error(
      "[VIP CONFIG ERROR] VIP_ID atau VIP_KEY belum diset di .env!"
    );
  }

  // 2. Debugging: Cek nilai di terminal (Hapus nanti jika production)
  // console.log('DEBUG VIP:', { id: config.apiId, key: config.apiKey });

  // 3. Pastikan data berbentuk String agar tidak jadi NaN
  const data = String(config.apiId) + String(config.apiKey);
  return crypto.createHash("md5").update(data).digest("hex");
};

const vipResellerService = {
  getProfile: async () => {
    try {
      const signature = generateSignature(); // Generate sign

      const payload = new URLSearchParams();
      payload.append("key", config.apiKey);
      payload.append("sign", signature);

      const response = await axios.post(`${config.baseUrl}/profile`, payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      return response.data;
    } catch (error) {
      // Log error lebih detail
      console.error("[VIP Service Error]", error.message);
      if (error.response) {
        console.error("Response Data:", error.response.data);
      }
      throw error;
    }
  },

  checkGameId: async (gameCode, userId, zoneId = "") => {
    try {
      const signature = generateSignature();

      const payload = new URLSearchParams();
      payload.append("key", config.apiKey);
      payload.append("sign", signature);
      payload.append("type", "get-nickname");
      payload.append("code", gameCode);
      payload.append("target", userId);
      payload.append("zone", zoneId);

      const response = await axios.post(
        `${config.baseUrl}/game-feature`,
        payload,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      return response.data;
    } catch (error) {
      console.error("[VIP Service Error]", error.message);
      throw error;
    }
  },
};

module.exports = vipResellerService;
