const appConfig = require("./config/app");
const express = require("express");
const morgan = require("morgan");
const { connectDB } = require("./config/database");

// --- IMPORT ROUTE ---
// Kita fokus ke satu jalur ini saja dulu
const loginRoutes = require("./routes/loginRoutes");

// --- IMPORT MIDDLEWARES (PERTAHANAN) ---
const { globalLimiter } = require("./middlewares/rateLimitMiddleware"); // Anti-DDoS
const {
  helmetConfig,
  corsConfig,
} = require("./middlewares/securityMiddleware"); // Armor & Satpam Domain
const { notFound, errorHandler } = require("./middlewares/errorMiddleware"); // Pemadam Kebakaran

const app = express();
const port = appConfig.port;

// ==========================================
// 1. GLOBAL SECURITY LAYER (PERISAI UTAMA)
// ==========================================

// A. Pasang Helm (Security Headers) - Wajib paling atas!
app.use(helmetConfig);

// B. Cek KTP Domain (CORS) - Siapa yang boleh request?
app.use(corsConfig);

// C. Pasang Portal Anti-DDoS (Rate Limiter Global)
// IP yang nembak ribuan kali dalam sedetik akan langsung diblokir di sini
app.use(globalLimiter);

// ==========================================
// 2. UTILITY LAYER
// ==========================================
app.use(morgan("dev")); // Log request ke console
app.use(express.json()); // Supaya bisa baca JSON
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 3. ROUTES LAYER (PINTU MASUK)
// ==========================================

// Health Check (Cek server hidup/mati)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "🛡️ Sistem Login Aman Terkendali 🛡️",
    env: appConfig.env,
  });
});

// Jalur Khusus Login (Sudah ada rate limiter khusus di dalamnya)
app.use("/api/login", loginRoutes);

// ==========================================
// 4. ERROR HANDLING (JARING PENGAMAN)
// ==========================================

// Tangkap request nyasar (404)
app.use(notFound);

// Tangkap error sistem (500)
app.use(errorHandler);

// ==========================================
// 5. START SERVER
// ==========================================
connectDB().then(() => {
  app.listen(port, () => {
    console.log(
      `\n[SERVER] Markas Komando Login Aktif di http://localhost:${port}`
    );
    console.log(`[SECURITY] Global Rate Limiter: ON`);
    console.log(`[SECURITY] Helmet Protection: ON`);
    console.log(`[SECURITY] CORS Whitelist: ON`);
  });
});
