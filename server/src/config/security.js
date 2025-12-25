const securityConfig = {
  // 1. KEBIJAKAN RATE LIMIT (Anti-Spam)
  rateLimit: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 Menit
      max: 1000, // 1000 request per IP
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 Menit
      max: 5, // Cuma boleh 5x salah password! (Sangat Ketat)
    },
    otp: {
      windowMs: 5 * 60 * 1000, // 5 Menit
      max: 3, // Cuma boleh 3x salah input OTP
    },
  },

  // 2. KEBIJAKAN PASSWORD (Encryption)
  bcrypt: {
    saltRounds: 10, // Standar industri (seimbang antara aman & cepat)
  },

  // 3. KEBIJAKAN CORS (Siapa yang boleh masuk?)
  cors: {
    whitelist: [
      "http://localhost:5173", // Frontend Dev
      "http://localhost:3000",
      process.env.CLIENT_URL, // Frontend Production
    ],
  },
};

module.exports = securityConfig;
