require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectDB } = require("./config/database");
const vipService = require("./services/vipResellerService");
const gameRoutes = require("./routes/gameRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/games", gameRoutes);
app.use("/api/auth", authRoutes);
app.get("/test-vip", async (req, res) => {
  try {
    const profile = await vipService.getProfile();
    res.json({
      status: "success",
      message: "Koneksi VIP Berhasil!",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/", (req, res) =>
  res.json({ status: "success", message: "Server Berjalan!" })
);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: "error", message: "Internal Server Error" });
});

// START SERVER (CUKUP SATU KALI DI SINI)
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`\n[SERVER] Berjalan di http://localhost:${port}`);
  });
});
