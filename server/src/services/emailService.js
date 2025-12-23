const nodemailer = require("nodemailer");

// 1. Konfigurasi Transporter (Tukang Pos)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true untuk port 465, false untuk port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Fungsi Kirim Email Verifikasi
const sendVerificationEmail = async (toEmail, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Game Topup Security" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Verifikasi Akun Game Topup Anda",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2563EB; text-align: center;">Verifikasi Email</h2>
        <p>Halo,</p>
        <p>Terima kasih sudah mendaftar. Untuk mengaktifkan akun Anda dan mulai bertransaksi, silakan klik tombol di bawah ini:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verifikasi Akun Saya</a>
        </div>
        
        <p style="color: #666; font-size: 12px;">Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationLink}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 10px; text-align: center;">Abaikan email ini jika Anda tidak merasa mendaftar di Game Topup.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Verifikasi terkirim ke: ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Gagal mengirim:", error);
    return false;
  }
};

// 2. --- TAMBAHAN BARU: Fungsi Kirim Reset Password ---
const sendResetPasswordEmail = async (toEmail, token) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Game Topup Security" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Reset Password Akun Anda",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #DC2626; text-align: center;">Permintaan Reset Password</h2>
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk mereset password akun Anda. Jika ini benar Anda, silakan klik tombol di bawah:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password Saya</a>
        </div>
        
        <p style="color: #666; font-size: 12px;">Link ini hanya berlaku selama 1 jam.</p>
        <p style="color: #666; font-size: 12px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Reset Password terkirim ke: ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Gagal mengirim reset password:", error);
    return false;
  }
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
