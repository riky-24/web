const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const adminModel = require("../models/adminModel");
const logModel = require("../models/logModel");
const appConfig = require("../config/app");
const { TOKEN_TYPES } = require("../config/constants");

const adminAuthService = {
  /**
   * TAHAP 1: Inisiasi Login Admin (Verifikasi Password + Anti Brute Force DB)
   */
  initiate: async (email, password, ipAddress) => {
    const normalizedEmail = email.toLowerCase();
    const admin = await adminModel.findAdminForLogin(normalizedEmail);

    // Pesan error generik untuk keamanan (User Enumeration Protection)
    const authError = "Kredensial Admin tidak valid.";

    // Jika admin tidak ditemukan, tetap lakukan komparasi dummy (Timing Attack Mitigation)
    if (!admin) {
      await bcrypt.compare(password || "dummy", "$2b$10$dummyhashstandard");
      throw new Error(authError);
    }

    // 1. CEK APAKAH AKUN SEDANG TERKUNCI?
    // Jika lockUntil ada dan waktunya belum lewat, tolak login
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((admin.lockUntil - new Date()) / 60000);
      throw new Error(
        `Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${minutesLeft} menit.`
      );
    }

    // 2. CEK PASSWORD
    const isMatch = await bcrypt.compare(password, admin.password);

    // --- JIKA PASSWORD SALAH ---
    if (!isMatch) {
      // Tambah counter kegagalan di database
      await adminModel.incrementLoginAttempts(
        admin.id,
        admin.failedLoginAttempts
      );

      // Jika sudah mencapai batas (5x Salah Password), kunci akun!
      if (admin.failedLoginAttempts + 1 >= 5) {
        await adminModel.lockAccount(admin.id);

        // Catat insiden keamanan level Critical
        await logModel.create({
          action: "ACCOUNT_LOCKED",
          userId: admin.id,
          details: "Akun dikunci otomatis (5x Salah Password)",
          ipAddress,
          level: "critical",
        });

        throw new Error(
          "Terlalu banyak percobaan gagal. Akun dikunci 30 menit."
        );
      }

      throw new Error(authError);
    }

    // --- JIKA PASSWORD BENAR ---

    // Reset counter dosa masa lalu jika user pernah salah password sebelumnya
    if (admin.failedLoginAttempts > 0 || admin.lockUntil) {
      await adminModel.resetLoginAttempts(admin.id);
    }

    // Cek Status Akun
    if (admin.isActive === false) throw new Error("Akun admin dinonaktifkan.");

    // Cek Ketersediaan MFA (Wajib buat Admin!)
    if (!admin.mfaSecret)
      throw new Error("Konfigurasi keamanan MFA tidak ditemukan.");

    // Generate Token "Ruang Tunggu" (Pre-Auth)
    // Token ini hanya berlaku 5 menit untuk dipakai verifikasi OTP
    const preAuthToken = jwt.sign(
      { id: admin.id, role: TOKEN_TYPES.PRE_AUTH, type: "ADMIN_LOGIN" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.preAuthExpiresIn }
    );

    // Log aktivitas sukses tahap 1
    await logModel.create({
      action: "ADMIN_AUTH_CHALLENGE",
      userId: admin.id,
      details: "Password OK, Menunggu OTP",
      ipAddress,
    });

    return { status: "MFA_REQUIRED", preAuthToken };
  },

  /**
   * TAHAP 2: Verifikasi Real-Time OTP Admin
   * Update: Menambahkan Logic Account Locking pada OTP Failure
   */
  verifyMfa: async (preAuthToken, otpCode, ipAddress) => {
    let decoded;
    try {
      decoded = jwt.verify(preAuthToken, appConfig.jwt.secret);
    } catch (e) {
      throw new Error("Sesi login admin kadaluwarsa.");
    }

    // Pastikan token yang dipakai adalah tipe PRE_AUTH
    if (decoded.role !== TOKEN_TYPES.PRE_AUTH) throw new Error("Akses Ilegal.");

    // 1. Ambil Data Admin Terbaru (Wajib refresh dari DB untuk cek lock status)
    // Kita cari via ID dari token, lalu pastikan mengambil field keamanan terbaru
    const admin = await adminModel.findAdminById(decoded.id);
    if (!admin) throw new Error("Admin tidak ditemukan.");

    // Kita panggil ulang findAdminForLogin menggunakan email yang didapat dari findAdminById
    // Tujuannya agar field 'lockUntil' & 'failedLoginAttempts' terbawa (jika findAdminById belum select itu)
    const adminSecure = await adminModel.findAdminForLogin(admin.email);

    // 2. CEK STATUS KUNCI (Defense Layer 1)
    // Penting: Jika akun terkunci saat user sedang di halaman input OTP
    if (adminSecure.lockUntil && adminSecure.lockUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (adminSecure.lockUntil - new Date()) / 60000
      );
      throw new Error(`Akun terkunci. Tunggu ${minutesLeft} menit.`);
    }

    // 3. Validasi TOTP menggunakan Speakeasy
    const isValid = speakeasy.totp.verify({
      secret: adminSecure.mfaSecret,
      encoding: "base32",
      token: otpCode,
      window: 1, // Toleransi waktu 30 detik
    });

    // --- JIKA OTP SALAH (Defense Layer 2) ---
    if (!isValid) {
      // Increment Counter Kegagalan
      await adminModel.incrementLoginAttempts(
        adminSecure.id,
        adminSecure.failedLoginAttempts
      );

      // Jika Salah > 3x (Lebih ketat dari password karena OTP cuma 6 digit)
      if (adminSecure.failedLoginAttempts + 1 >= 3) {
        await adminModel.lockAccount(adminSecure.id);

        await logModel.create({
          action: "ACCOUNT_LOCKED_MFA",
          userId: adminSecure.id,
          details: "Akun dikunci otomatis (3x Salah OTP)",
          ipAddress,
          level: "critical",
        });

        throw new Error("OTP Salah 3x. Akun dikunci otomatis demi keamanan.");
      }

      await logModel.create({
        action: "ADMIN_MFA_FAIL",
        userId: adminSecure.id,
        details: "Kode OTP Salah",
        ipAddress,
        level: "warn",
      });

      throw new Error("Kode OTP tidak valid.");
    }

    // --- JIKA OTP BENAR ---

    // Login Berhasil: Reset semua dosa masa lalu
    if (adminSecure.failedLoginAttempts > 0 || adminSecure.lockUntil) {
      await adminModel.resetLoginAttempts(adminSecure.id);
    }

    // Terbitkan Token Akses Penuh (FULL)
    const accessToken = jwt.sign(
      { id: adminSecure.id, role: "ADMIN", status: "FULL" },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.accessExpiresIn }
    );

    await logModel.create({
      action: "ADMIN_LOGIN_SUCCESS",
      userId: adminSecure.id,
      details: "Admin berhasil masuk sistem (MFA Verified)",
      ipAddress,
    });

    return {
      accessToken,
      admin: {
        id: adminSecure.id,
        username: adminSecure.username,
        email: adminSecure.email,
      },
    };
  },
};

module.exports = adminAuthService;
