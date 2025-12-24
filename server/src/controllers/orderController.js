const { prisma } = require("../config/database");
const midtransService = require("../services/midtransService");
const vipService = require("../services/vipResellerService");
const crypto = require("crypto");

const orderController = {
  // 1. BUAT PESANAN (User Checkout) - Tidak ada perubahan logika, hanya formatting
  createOrder: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null;
      const { productId, gameUserId, zoneId, method } = req.body;

      // [Security] Validasi input dasar
      if (!productId || !gameUserId) {
        return res.status(400).json({ message: "Data pesanan tidak lengkap" });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { game: true },
      });

      if (!product)
        return res.status(404).json({ message: "Produk tidak ditemukan" });

      const newOrder = await prisma.order.create({
        data: {
          userId: userId,
          productId: product.id,
          playerId: gameUserId,
          serverZone: zoneId || "",
          amount: product.price,
          status: "pending",
          paymentMethod: method || "otomanis",
        },
      });

      const itemDetails = [
        {
          id: product.id,
          price: product.price,
          quantity: 1,
          name: `${product.game.name} - ${product.name}`.substring(0, 50),
        },
      ];

      const customerDetails = {
        first_name: req.user ? req.user.username : "Guest",
        email: req.user ? req.user.email : "guest@topup.com",
        phone: "08123456789", // Sebaiknya ambil dari input user jika ada
      };

      const midtransData = await midtransService.createTransaction(
        newOrder.id,
        newOrder.amount,
        customerDetails,
        itemDetails
      );

      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          paymentUrl: midtransData.redirect_url,
          midtransTrxId: midtransData.token,
        },
      });

      res.json({
        status: "success",
        data: {
          orderId: newOrder.id,
          snapToken: midtransData.token,
          paymentUrl: midtransData.redirect_url,
        },
      });
    } catch (error) {
      console.error("[Create Order Error]", error);
      res
        .status(500)
        .json({ status: "error", message: "Gagal membuat pesanan" });
    }
  },

  // 2. WEBHOOK MIDTRANS - Area Perbaikan Utama
  handleNotification: async (req, res) => {
    try {
      const notification = req.body;
      const orderId = notification.order_id;
      const transactionStatus = notification.transaction_status;
      const fraudStatus = notification.fraud_status;
      const statusCode = notification.status_code;
      const grossAmount = notification.gross_amount;
      const signatureKey = notification.signature_key;

      if (!orderId || !signatureKey) {
        return res.status(400).json({ message: "Invalid Notification Body" });
      }

      // A. VERIFIKASI SIGNATURE (SECURE)
      // Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
      const dataString = `${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`;
      const mySignature = crypto
        .createHash("sha512")
        .update(dataString)
        .digest("hex");

      // [Security] Mencegah Timing Attack dengan timingSafeEqual
      const signatureValid = crypto.timingSafeEqual(
        Buffer.from(signatureKey),
        Buffer.from(mySignature)
      );

      if (!signatureValid) {
        console.warn(
          `[Security Alert] Invalid Signature attempt for Order ${orderId}`
        );
        return res.status(403).json({ message: "Invalid Signature" });
      }

      // B. CEK STATUS DATABASE
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { product: true },
      });

      if (!order) return res.status(404).json({ message: "Order not found" });

      // [Idempotency] Jika sudah sukses, jangan proses lagi (cegah double topup)
      if (order.status === "success" || order.status === "processing") {
        return res.status(200).json({ message: "Order already processed" });
      }

      // C. LOGIKA STATUS PEMBAYARAN
      let paymentSuccess = false;
      let newStatus = order.status;

      if (transactionStatus === "capture") {
        if (fraudStatus === "challenge") {
          newStatus = "challenge";
        } else if (fraudStatus === "accept") {
          paymentSuccess = true;
        }
      } else if (transactionStatus === "settlement") {
        paymentSuccess = true;
      } else if (["cancel", "deny", "expire"].includes(transactionStatus)) {
        newStatus = "failed";
      } else if (transactionStatus === "pending") {
        newStatus = "pending";
      }

      // Update status jika gagal/pending/challenge
      if (!paymentSuccess && newStatus !== order.status) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: newStatus },
        });
        return res.status(200).json({ status: "ok" });
      }

      // D. EKSEKUSI KIRIM BARANG (HANYA JIKA SUDAH BAYAR)
      if (paymentSuccess) {
        // [Locking] Update ke processing dulu agar request paralel lain ditolak di tahap B
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "processing" },
        });

        console.log(`[Process Order] Processing topup for Order ${orderId}`);

        try {
          // --- TEMBAK VIP RESELLER ---
          // [Fix] Sekarang fungsi transaction sudah ada di service
          const trxVip = await vipService.transaction(
            order.id,
            order.product.vipCode,
            order.playerId,
            order.serverZone
          );

          if (trxVip.result) {
            // SUKSES DARI PROVIDER
            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "success",
                vipTrxId: trxVip.data.trxid,
                note: trxVip.message,
              },
            });
          } else {
            // GAGAL DARI PROVIDER -> Coba Recheck Status (Anti-Rugi)
            console.error(`[VIP Failed] Order ${orderId}: ${trxVip.message}`);

            // Cek ulang status ke provider untuk memastikan
            const check = await vipService.checkStatus(orderId);

            // Logika pengecekan status manual provider
            if (check && check.data && check.data[0]?.status === "success") {
              await prisma.order.update({
                where: { id: orderId },
                data: { status: "success", note: "Rechecked: Success (Auto)" },
              });
            } else {
              // Jika benar-benar gagal
              await prisma.order.update({
                where: { id: orderId },
                data: {
                  status: "failed",
                  note: trxVip.message || "Provider Failed",
                },
              });
            }
          }
        } catch (vipError) {
          console.error(
            `[VIP Exception] Order ${orderId} error:`,
            vipError.message
          );
          // Jika error koneksi/timeout, set ke manual check, jangan langsung failed
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "manual_check",
              note: "Provider Timeout/Error. Please check manually.",
            },
          });
        }
      }

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("[Webhook Error]", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // 3. RIWAYAT TRANSAKSI USER (Dibiarkan tetap sama jika tidak ada isu)
  getMyOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const orders = await prisma.order.findMany({
        where: { userId: userId },
        include: { product: { include: { game: true } } },
        orderBy: { createdAt: "desc" },
      });
      res.json({ status: "success", data: orders });
    } catch (error) {
      console.error("My Orders Error:", error);
      res.status(500).json({ message: "Gagal mengambil data transaksi." });
    }
  },

  getOrderDetail: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { product: { include: { game: true } } },
      });
      if (!order)
        return res.status(404).json({ message: "Order tidak ditemukan" });
      res.json({ status: "success", data: order });
    } catch (error) {
      res.status(500).json({ message: "Error server" });
    }
  },
};

module.exports = orderController;
