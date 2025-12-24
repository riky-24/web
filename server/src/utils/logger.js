// Logger manual tanpa library tambahan (biar ringan)
const logger = {
  // Format waktu: YYYY-MM-DDTHH:mm:ss
  getTime: () => new Date().toISOString(),

  info: (message, context = "System") => {
    console.log(
      `\x1b[32m[INFO]\x1b[0m [${logger.getTime()}] [${context}] ${message}`
    );
  },

  warn: (message, context = "System") => {
    console.warn(
      `\x1b[33m[WARN]\x1b[0m [${logger.getTime()}] [${context}] ${message}`
    );
  },

  error: (message, error = null) => {
    const errDetail = error
      ? `\nStack: ${error.stack || error.message || error}`
      : "";
    console.error(
      `\x1b[31m[ERROR]\x1b[0m [${logger.getTime()}] ${message}${errDetail}`
    );
  },

  // Log Khusus Transaksi (Warna Cyan biar mencolok)
  transaction: (trxId, status, note = "") => {
    console.log(
      `\x1b[36m[TRX]\x1b[0m  [${logger.getTime()}] ID:${trxId} | Status:${status} | ${note}`
    );
  },
};

module.exports = logger;
