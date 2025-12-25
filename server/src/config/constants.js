const constants = {
  // ROLE USER
  ROLES: {
    ADMIN: "ADMIN",
    USER: "USER",
    VIP: "VIP",
    RESELLER: "RESELLER",
  },

  // TAHAPAN LOGIN (STATE MACHINE)
  AUTH_STEPS: {
    INITIATE: "INITIATE",
    MFA_VERIFICATION: "MFA",
    COMPLETE: "COMPLETE",
  },

  // JENIS TOKEN
  TOKEN_TYPES: {
    PRE_AUTH: "PRE_AUTH_TOKEN", // Token Ruang Tunggu
    ACCESS: "ACCESS_TOKEN", // Token Masuk
    REFRESH: "REFRESH_TOKEN", // Token Perpanjangan
  },

  // PESAN RESPON STANDAR (Supaya konsisten)
  MESSAGES: {
    AUTH: {
      INVALID_CREDENTIALS: "Email atau Password salah.", // Pesan generik (aman)
      MFA_REQUIRED: "Verifikasi tambahan diperlukan.",
      ACCOUNT_LOCKED: "Akun dikunci sementara demi keamanan.",
      UNVERIFIED: "Akun belum diverifikasi.",
    },
  },
};

module.exports = constants;
