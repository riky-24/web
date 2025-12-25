const helmet = require("helmet");
const cors = require("cors");
const securityConfig = require("../config/security");

/**
 * Konfigurasi Helmet (HTTP Headers Security)
 * Update: CSP Directives Lengkap untuk mengatasi alert High Risk di OWASP ZAP
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    useDefaults: false, // Matikan default agar kita bisa atur manual secara ketat
    directives: {
      // 1. FALLBACK UTAMA (Wajib ada untuk lolos scan ZAP)
      // Mengatur sumber default untuk resource yang tidak didefinisikan spesifik
      defaultSrc: ["'self'"],

      // 2. SCRIPT (Anti XSS)
      // Izinkan script dari server sendiri.
      // 'unsafe-inline' sementara diaktifkan agar script React/Vite jalan lancar.
      scriptSrc: ["'self'", "'unsafe-inline'"],

      // 3. STYLE
      // Izinkan CSS dari server sendiri dan inline-style (biasa dipakai library UI)
      styleSrc: ["'self'", "'unsafe-inline'"],

      // 4. GAMBAR
      // Izinkan gambar dari server sendiri, base64 (data:), dan HTTPS (misal CDN game)
      imgSrc: ["'self'", "data:", "https:"],

      // 5. KONEKSI AJAX/API
      // Cegah script mengirim data curian ke server hacker (hanya boleh ke diri sendiri)
      connectSrc: ["'self'"],

      // 6. FONT
      // Izinkan font dari server sendiri atau Google Fonts (https)
      fontSrc: ["'self'", "data:", "https:"],

      // 7. PLUGIN BERBAHAYA (CRITICAL untuk ZAP)
      // Blokir total Flash, Java Applet, dll.
      objectSrc: ["'none'"],

      // 8. ANTI CLICKJACKING
      // Website ini tidak boleh di-embed di dalam iframe oleh website orang lain
      frameAncestors: ["'self'"],

      // 9. SECURITY LAINNYA
      baseUri: ["'self'"],
      upgradeInsecureRequests: [], // Paksa upgrade HTTP ke HTTPS jika memungkinkan
    },
  },
  // Izinkan resource dimuat lintas origin jika diperlukan (misal gambar produk)
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Konfigurasi CORS (Cross-Origin Resource Sharing)
 * Mengatur siapa saja yang boleh mengakses API ini
 */
const corsConfig = cors({
  origin: (origin, callback) => {
    // Ambil Whitelist dari Config
    const whitelist = securityConfig.cors.whitelist;

    // !origin berarti request dari Server-to-Server (misal Postman atau Backend itu sendiri)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Akses Ditolak oleh CORS Policy"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Izinkan kirim Cookies/Auth Headers
});

module.exports = { helmetConfig, corsConfig };
