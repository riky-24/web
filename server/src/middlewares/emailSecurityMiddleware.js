const dns = require("dns");

const checkEmailDomain = async (req, res, next) => {
  const { email } = req.body;

  // Jika email kosong, biarkan validator lain yang handle
  if (!email) return next();

  const normalizedEmail = email.toLowerCase();
  const domain = normalizedEmail.split("@")[1];

  if (!domain) {
    return res.status(400).json({ message: "Format email tidak valid!" });
  }

  try {
    const isValidDomain = await new Promise((resolve) => {
      // Timeout 5 detik agar tidak hang
      const timeout = setTimeout(() => resolve(false), 5000);

      dns.resolveMx(domain, (err, addresses) => {
        clearTimeout(timeout);
        if (err || !addresses || addresses.length === 0) resolve(false);
        else resolve(true);
      });
    });

    if (!isValidDomain) {
      return res
        .status(400)
        .json({ message: "Domain email tidak valid atau tidak ditemukan!" });
    }

    // Update req.body dengan email yang sudah dinormalisasi (lowercase)
    // agar controller terima data bersih
    req.body.email = normalizedEmail;
    next();
  } catch (error) {
    console.error("DNS Check Error:", error);
    // Default allow jika DNS server error (opsional, atau bisa block)
    return res
      .status(500)
      .json({ message: "Gagal memverifikasi domain email." });
  }
};

module.exports = { checkEmailDomain };
