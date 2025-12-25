const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

// Definisi Level Log (Sesuai standar Syslog)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Warna untuk console (biar enak dilihat pas dev)
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Format Log Forensik (Timestamp + Pesan)
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// Lokasi penyimpanan file log
const logDirectory = path.join(__dirname, "../../logs");

const transports = [
  // 1. CCTV Debug (Tampil di Console)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
      )
    ),
  }),

  // 2. CCTV Error (Simpan error sistem)
  new winston.transports.DailyRotateFile({
    filename: path.join(logDirectory, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxSize: "20m", // Putar file jika > 20MB
    maxFiles: "14d", // Simpan cuma 14 hari
  }),

  // 3. CCTV Security (Simpan aktivitas mencurigakan & login)
  // Kita akan filter level 'warn' dan 'info' khusus yang ada tag 'SECURITY'
  new winston.transports.DailyRotateFile({
    filename: path.join(logDirectory, "security-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "30d", // Simpan 30 hari untuk audit
    level: "info",
  }),
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "warn",
  levels,
  format,
  transports,
});

module.exports = logger;
