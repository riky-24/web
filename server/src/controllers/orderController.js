const { prisma } = require("../config/database");
const midtransService = require("../services/midtransService");
const vipService = require("../services/vipResellerService");
const crypto = require("crypto");

const orderController = {
  // 1. BUAT PESANAN (User Checkout)
  createOrder: async (req, res) => {
    try {
      // req.user dari authMiddleware (bisa null jika guest)
      const userId = req.user ? req.user.id : null;
      const { productId, gameUserId, zoneId, method } = req.body;

      // Ambil Harga ASLI dari Database (Anti-Hack Harga)
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { game: true },
      });

      if (!product)
        return res.status(404).json({ message: "Produk tidak ditemukan" });

      // Buat Order di Database (Status: Pending)
      const newOrder = await prisma.order.create({
        data: {
          userId: userId,
          productId: product.id,
          playerId: gameUserId,
          serverZone: zoneId,
          amount: product.price, // Harga diambil dari DB
          status: "pending",
          paymentMethod: method || "otomanis",
        },
      });

      // Siapkan data ke Midtrans
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
        phone: "08123456789",
      };

      // Minta Snap Token
      const midtransData = await midtransService.createTransaction(
        newOrder.id,
        newOrder.amount,
        customerDetails,
        itemDetails
      );

      // Simpan URL Pembayaran
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

  // 2. WEBHOOK MIDTRANS (JANTUNG TRANSAKSI ANTI-RUGI)
  handleNotification: async (req, res) => {
    try {
      const notification = req.body;
      const orderId = notification.order_id;
      const transactionStatus = notification.transaction_status;
      const fraudStatus = notification.fraud_status;
      const statusCode = notification.status_code;
      const grossAmount = notification.gross_amount;
      const signatureKey = notification.signature_key;

      // A. VERIFIKASI SIGNATURE (Keamanan Wajib)
      // Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
      const mySignature = crypto
        .createHash("sha512")
        .update(
          `${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`
        )
        .digest("hex");

      if (signatureKey !== mySignature) {
        return res.status(403).json({ message: "Invalid Signature" });
      }

      // B. CEK STATUS DATABASE
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { product: true }, // Butuh kode VIP produk
      });

      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.status === "success")
        return res.status(200).json({ message: "Already success" });

      // C. LOGIKA STATUS PEMBAYARAN
      let paymentSuccess = false;
      if (transactionStatus === "capture") {
        if (fraudStatus === "challenge") {
          // Transaksi dicurigai, jangan kirim barang dulu
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "challenge" },
          });
        } else if (fraudStatus === "accept") {
          paymentSuccess = true;
        }
      } else if (transactionStatus === "settlement") {
        paymentSuccess = true;
      } else if (
        transactionStatus === "cancel" ||
        transactionStatus === "deny" ||
        transactionStatus === "expire"
      ) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "failed" },
        });
      }

      // D. EKSEKUSI KIRIM BARANG (HANYA JIKA SUDAH BAYAR)
      if (paymentSuccess) {
        // Update status jadi processing dulu
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "processing" },
        });

        try {
          // --- COBA TEMBAK VIP RESELLER ---
          const trxVip = await vipService.transaction(
            order.id, // TrxID kita
            order.product.vipCode, // Kode Barang (ML86, dll)
            order.playerId, // ID Player
            order.serverZone // Zone ID
          );

          if (trxVip.result) {
            // SUKSES DARI PROVIDER
            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "success",
                vipTrxId: trxVip.data.trxid, // Simpan ID transaksi dari VIP
                note: trxVip.message,
              },
            });
          } else {
            // GAGAL DARI PROVIDER (Saldo habis / Maintenance / Salah ID)
            await prisma.order.update({
              where: { id: orderId },
              data: { status: "failed", note: trxVip.message },
            });
          }
        } catch (vipError) {
          // --- LOGIKA ANTI-RUGI (RE-CHECK STATUS) ---
          console.error(
            `[VIP Error] Order ${orderId} bermasalah:`,
            vipError.message
          );

          // Jangan langsung failed! Cek status ke VIP dulu
          const check = await vipService.checkStatus(orderId);

          if (check && check.data && check.data[0].status === "success") {
            // Ternyata sukses di sana (cuma response telat)
            await prisma.order.update({
              where: { id: orderId },
              data: { status: "success", note: "Rechecked: Success" },
            });
          } else if (check && check.data && check.data[0].status === "error") {
            // Beneran gagal di sana
            await prisma.order.update({
              where: { id: orderId },
              data: { status: "failed", note: "Rechecked: Failed" },
            });
          } else {
            // Tidak jelas/Provider mati total -> Manual Check
            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "manual_check",
                note: "Provider Timeout. Cek Manual.",
              },
            });
          }
        }
      }

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("[Webhook Error]", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // 3. RIWAYAT TRANSAKSI USER
  getMyOrders: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: { product: { include: { game: true } } },
        orderBy: { createdAt: "desc" },
      });

      res.json({ status: "success", data: orders });
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data" });
    }
  },

  // 4. CEK DETAIL ORDER (PUBLIC/RECEIPT)
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
