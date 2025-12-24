const axios = require("axios");
const crypto = require("crypto");
const config = require("../config/vipreseller");
const { createMD5 } = require("../utils/cryptoHelper");

// Helper: Membuat Signature MD5 (API ID + API KEY)
// [Security] Menggunakan fungsi crypto bawaan, bukan fungsi global md5() yang tidak terdefinisi
const generateSignature = () => {
  if (!config.apiId || !config.apiKey) {
    throw new Error(
      "[VIP CONFIG ERROR] VIP_ID atau VIP_KEY belum diset di .env!"
    );
  }
  const data = config.apiId + config.apiKey;
  return createMD5(data); // Pakai Utils
};

const vipResellerService = {
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

  // [Fix Critical] Fungsi ini sebelumnya TIDAK ADA, menyebabkan server crash saat user bayar.
  transaction: async (trxId, serviceCode, target, zone = "") => {
    try {
      const signature = generateSignature();

      // Menggunakan URLSearchParams agar konsisten dengan endpoint lain
      const payload = new URLSearchParams();
      payload.append("key", config.apiKey);
      payload.append("sign", signature);
      payload.append("type", "order"); // Tipe request order
      payload.append("service", serviceCode); // Kode layanan (misal: ML86)
      payload.append("data_no", `${target}${zone ? zone : ""}`); // Nomor tujuan gabungan
      payload.append("trx_id", trxId); // ID referensi unik dari kita

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
      // Return object error agar tidak throw dan memutus flow controller
      return {
        result: false,
        message: error?.response?.data?.message || "Connection Error",
      };
    }
  },

  // [Fix Bug] Memperbaiki referensi error 'md5 is not defined' dan penggunaan process.env langsung
  checkStatus: async (trxId) => {
    try {
      const signature = generateSignature(); // Gunakan helper yang sudah benar

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
