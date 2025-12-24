require("dotenv").config();

// Validasi Key Provider
if (!process.env.VIP_API_ID || !process.env.VIP_API_KEY) {
  console.error(
    "[CONFIG ERROR] VIP_API_ID atau VIP_API_KEY belum diset di .env!"
  );
  // Opsional: process.exit(1) jika aplikasi ini murni jualan topup
}

const vipConfig = {
  apiId: process.env.VIP_API_ID,
  apiKey: process.env.VIP_API_KEY,
  baseUrl: process.env.VIP_API_URL || "https://vip-reseller.co.id/api", // Fallback ke URL default
};

module.exports = vipConfig;
