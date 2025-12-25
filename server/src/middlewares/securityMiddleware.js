const helmet = require("helmet");
const cors = require("cors");
const securityConfig = require("../config/security"); // [BARU]

const helmetConfig = helmet({
  // ... (Config Helmet tetap sama/hardcode aman karena jarang berubah)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // ...
    },
  },
});

const corsConfig = cors({
  origin: (origin, callback) => {
    // [FIX] Ambil Whitelist dari Config
    const whitelist = securityConfig.cors.whitelist;

    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
});

module.exports = { helmetConfig, corsConfig };
