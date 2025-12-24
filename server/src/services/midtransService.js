const { snap } = require("../config/midtrans");

const midtransService = {
  /**
   * Membuat Transaksi ke Midtrans (Minta Token & Redirect URL)
   * @param {string|number} orderId - ID Order unik dari Database
   * @param {number} amount - Total harga
   * @param {Object} customerDetails - Data pembeli { first_name, email, phone }
   * @param {Array} itemDetails - Detail barang [{ id, price, quantity, name }]
   */
  createTransaction: async (orderId, amount, customerDetails, itemDetails) => {
    try {
      // Parameter standar Midtrans Snap
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        credit_card: {
          secure: true,
        },
        customer_details: customerDetails,
        item_details: itemDetails,
        // expiry: { ... } // Opsional: Atur waktu kadaluarsa link
      };

      // Request ke Midtrans menggunakan instance yang sudah dikonfigurasi
      const transaction = await snap.createTransaction(parameter);

      return transaction; // Return: { token: "...", redirect_url: "..." }
    } catch (error) {
      console.error(
        "[Midtrans Error] Failed to create transaction:",
        error.message
      );
      // Lempar error agar controller tahu ada masalah
      throw new Error("Gagal menghubungkan ke gateway pembayaran.");
    }
  },
};

module.exports = midtransService;
