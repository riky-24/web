const constants = {
  // ROLE KHUSUS PERSONIL (Tidak ada role USER publik)
  ROLES: {
    ADMIN: "ADMIN", // Super Admin
    STAFF: "STAFF", // Petugas Operasional
    RESELLER: "RESELLER", // Partner VIP
  },

  AUTH_STEPS: {
    INITIATE: "INITIATE",
    MFA_VERIFICATION: "MFA",
    COMPLETE: "COMPLETE",
  },

  TOKEN_TYPES: {
    PRE_AUTH: "PRE_AUTH_TOKEN",
    ACCESS: "ACCESS_TOKEN",
    REFRESH: "REFRESH_TOKEN",
  },

  MESSAGES: {
    AUTH: {
      INVALID_CREDENTIALS: "Akses ditolak. Email atau Password salah.",
      MFA_REQUIRED: "Verifikasi Keamanan (MFA) diperlukan.",
      ACCOUNT_LOCKED: "Akun ditangguhkan. Hubungi Super Admin.",
      UNAUTHORIZED_ROLE: "Anda tidak memiliki izin akses ke Panel ini.", // Pesan baru
    },
  },
};

module.exports = constants;
