const stringHelper = {
  /**
   * Generate Username unik dari email
   * Contoh: 'budi.santoso@gmail.com' -> 'budisantoso4821'
   */
  generateUsernameFromEmail: (email) => {
    if (!email) return "user" + Math.floor(Math.random() * 10000);

    // Ambil nama depan, hapus karakter non-alphanumeric
    const cleanName = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    return `${cleanName}${randomSuffix}`;
  },

  /**
   * Generate Transaksi ID Unik
   * Contoh: 'TRX-1701234567890-123'
   */
  generateTrxId: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TRX-${timestamp}-${random}`;
  },

  /**
   * Format Angka ke Rupiah (Bagus untuk logging/notif)
   * Contoh: 15000 -> "Rp 15.000"
   */
  formatRupiah: (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Masking Email untuk Privasi Log
   * Contoh: 'johndoe@gmail.com' -> 'jo*****@gmail.com'
   */
  maskEmail: (email) => {
    if (!email) return "unknown";
    const [name, domain] = email.split("@");
    const maskedName = name.substring(0, 2) + "*****";
    return `${maskedName}@${domain}`;
  },
};

module.exports = stringHelper;
