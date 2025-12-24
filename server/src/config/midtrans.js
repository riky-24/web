const midtransClient = require("midtrans-client");
require("dotenv").config();

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;

// Validasi Key (Penting agar tidak error diam-diam)
if (!serverKey || !clientKey) {
  console.warn(
    "[CONFIG WARNING] MIDTRANS_SERVER_KEY atau CLIENT_KEY belum diset! Transaksi akan gagal."
  );
}

// 1. Instance Snap (Untuk membuat token pembayaran)
const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: serverKey,
  clientKey: clientKey,
});

// 2. Instance Core API (Untuk cek status transaksi, cancel, refund)
const coreApi = new midtransClient.CoreApi({
  isProduction: isProduction,
  serverKey: serverKey,
  clientKey: clientKey,
});

module.exports = {
  snap,
  coreApi,
  serverKey, // [PENTING] Diexport untuk validasi Signature di orderService
  isProduction,
};
