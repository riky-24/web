const midtransClient = require("midtrans-client");
require("dotenv").config();

// Tentukan mode Production/Sandbox
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

// Validasi Key (Beri peringatan saja, jangan matikan server, siapa tau cuma mau cek harga)
if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
  console.warn(
    "[CONFIG WARNING] MIDTRANS_SERVER_KEY atau CLIENT_KEY belum diset! Fitur pembayaran mungkin error."
  );
}

// 1. Instance Snap (Untuk membuat transaksi/token)
const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// 2. Instance Core API (Untuk cek status transaksi, cancel, refund)
const coreApi = new midtransClient.CoreApi({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = { snap, coreApi, isProduction };
