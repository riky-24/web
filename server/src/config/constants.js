const constants = {
  // Daftar Role User (Supaya konsisten huruf besar/kecilnya)
  ROLES: {
    ADMIN: "ADMIN",
    USER: "USER",
    VIP: "VIP",
    RESELLER: "RESELLER",
  },

  // Nilai Default jika belum diset di Database SystemConfig
  DEFAULTS: {
    MARGIN: {
      USER: 0.05, // 5%
      RESELLER: 0.02, // 2%
      VIP: 0.01, // 1%
    },
    SERVICE_FEE: 0, // Rp 0
    IS_MAINTENANCE: false,
  },

  // Status Order (Biar gak typo 'success' jadi 'succes')
  ORDER_STATUS: {
    PENDING: "pending",
    PROCESSING: "processing",
    SUCCESS: "success",
    FAILED: "failed",
    EXPIRED: "expire",
    CHALLENGE: "challenge",
  },
};

module.exports = constants;
