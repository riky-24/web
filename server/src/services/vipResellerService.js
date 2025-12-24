const axios = require("axios");
// [CLEANUP] Hapus 'crypto' karena sudah pakai helper
const config = require("../config/vipreseller");
const { createMD5 } = require("../utils/cryptoHelper");

// Helper: Membuat Signature MD5 (API ID + API KEY)
const generateSignature = () => {
  if (!config.apiId || !config.apiKey) {
    throw new Error(
      "[VIP CONFIG ERROR] VIP_ID atau VIP_KEY belum diset di .env!"
    );
  }
  const data = config.apiId + config.apiKey;
  return createMD5(data); // Menggunakan Utils yang aman
};

const vipResellerService = {
  // 1. CEK PROFIL (Saldo & Status)
  getProfile: async () => {
    try {
      const signature = generateSignature();
      const payload = new URLSearchParams();
      payload.append("key", config.apiKey);
      payload.append("sign", signature);

      const response = await axios.post(`${config.baseUrl}/profile`, payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return response.data;
    } catch (error) {
      console.error(
        "[VIP Profile Error]",
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  // 2. CEK NICKNAME GAME (Validasi ID Player)
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
      console.error(
        "[VIP CheckID Error]",
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  // 3. TRANSAKSI (Order Item)
  transaction: async (trxId, serviceCode, target, zone = "") => {
    try {
      const signature = generateSignature();

      const payload = new URLSearchParams();
      payload.append("key", config.apiKey);
      payload.append("sign", signature);
      payload.append("type", "order");
      payload.append("service", serviceCode);
      // Format data_no: ID gabung Zone (jika ada)
      payload.append("data_no", `${target}${zone ? zone : ""}`);
      payload.append("trx_id", trxId);

      console.log(`[VIP TRX] Sending Order: ${trxId} - Code: ${serviceCode}`);

      const response = await axios.post(
        `${config.baseUrl}/game-feature`,
        payload,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "[VIP Transaction Error]",
        error?.response?.data || error.message
      );
      // Return object error agar logic di Service/Controller pemanggil bisa handle gracefully
      return {
        result: false,
        message:
          error?.response?.data?.message || "Connection Error to Provider",
      };
    }
  },

  // 4. CEK STATUS TRANSAKSI
  checkStatus: async (trxId) => {
    try {
      const signature = generateSignature();

      const payload = new URLSearchParams();
      payload.append("key", config.apiKey);
      payload.append("sign", signature);
      payload.append("type", "status");
      payload.append("trx_id", trxId);

      const response = await axios.post(
        `${config.baseUrl}/game-feature`,
        payload,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      return response.data;
    } catch (error) {
      console.error("[VIP CheckStatus Error]", error?.message);
      return null;
    }
  },
};

module.exports = vipResellerService;
