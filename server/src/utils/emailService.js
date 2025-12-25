const nodemailer = require("nodemailer");

// Konfigurasi Transporter (Sesuaikan dengan penyedia email Anda)
// Tips: Untuk development, pakai Mailtrap.io. Untuk production pakai Gmail/Sendgrid.
const transporter = nodemailer.createTransport({
  service: "gmail", // Atau 'smtp.mailtrap.io'
  auth: {
    user: process.env.SMTP_EMAIL, // Masukkan di .env
    pass: process.env.SMTP_PASSWORD, // Masukkan di .env
  },
});

const emailService = {
  sendResetEmail: async (toEmail, token) => {
    // Link mengarah ke Frontend (React)
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: '"Admin Security" <no-reply@reseller.com>',
      to: toEmail,
      subject: "Permintaan Reset Password Admin",
      html: `
        <h3>Halo Admin,</h3>
        <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
        <p>Silakan klik link di bawah ini untuk membuat password baru:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Link ini hanya berlaku selama <strong>15 menit</strong>.</p>
        <p>Jika Anda tidak meminta ini, abaikan saja email ini.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Reset link sent to ${toEmail}`);
    } catch (error) {
      console.error("[EMAIL] Gagal kirim email:", error);
      throw new Error("Gagal mengirim email reset.");
    }
  },
};

module.exports = emailService;
