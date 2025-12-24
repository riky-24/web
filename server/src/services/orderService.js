const { prisma } = require("../config/database");
const midtransService = require("./midtransService");
const vipService = require("./vipResellerService");
const crypto = require("crypto");

const orderService = {
  /**
   * Membuat Order Baru (Pending Payment).
   * @param {Object} user - Data user yang sedang login (bisa null jika Guest)
   * @param {Object} orderData - { productId, gameUserId, zoneId, method }
   */
  createTransaction: async (user, orderData) => {
    const { productId, gameUserId, zoneId, method } = orderData;

    // 1. Validasi Product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { game: true },
    });

    if (!product) throw new Error("Produk tidak ditemukan.");

    // 2. Hitung Harga (Bisa disamakan logicnya dengan gameService jika perlu dynamic price saat checkout)
    // Untuk saat ini kita pakai harga database dulu, atau panggil logic margin lagi.
    const finalPrice = product.price; // TODO: Implementasikan ulang logic margin jika perlu konsistensi

    // 3. Buat Record Order di Database (Status: Pending)
    const newOrder = await prisma.order.create({
      data: {
        userId: user ? user.id : null, // Support Guest checkout
        productId: product.id,
        playerId: gameUserId,
        serverZone: zoneId || "",
        amount: finalPrice,
        status: "pending",
        paymentMethod: method || "qris", // Default method
      },
    });

    // 4. Siapkan Data untuk Midtrans
    const itemDetails = [
      {
        id: product.id,
        price: finalPrice,
        quantity: 1,
        name: `${product.game.name} - ${product.name}`.substring(0, 50),
      },
    ];

    const customerDetails = {
      first_name: user ? user.username : "Guest User",
      email: user ? user.email : "guest@store.com",
    };

    // 5. Request ke Midtrans (Snap Token)
    const midtransData = await midtransService.createTransaction(
      newOrder.id,
      newOrder.amount,
      customerDetails,
      itemDetails
    );

    // 6. Update Order dengan Token Pembayaran
    await prisma.order.update({
      where: { id: newOrder.id },
      data: {
        paymentUrl: midtransData.redirect_url,
        midtransTrxId: midtransData.token,
      },
    });

    return {
      orderId: newOrder.id,
      snapToken: midtransData.token,
      paymentUrl: midtransData.redirect_url,
    };
  },

  /**
   * Menangani Webhook Notifikasi dari Midtrans.
   * Memvalidasi signature, update status DB, dan order ke Provider jika lunas.
   */
  processPaymentNotification: async (notification) => {
    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
    } = notification;

    if (!order_id || !signature_key) {
      throw new Error("Invalid Notification Body");
    }

    // --- A. Security: Validasi Signature ---
    const dataString = `${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`;
    const mySignature = crypto
      .createHash("sha512")
      .update(dataString)
      .digest("hex");

    // Gunakan timingSafeEqual untuk mencegah Timing Attack
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature_key),
      Buffer.from(mySignature)
    );

    if (!isValid)
      throw new Error("Invalid Signature! Potential hacking attempt.");

    // --- B. Cek Data Order ---
    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: { product: true },
    });

    if (!order) throw new Error("Order not found in database.");

    // Idempotency: Jika sudah sukses, skip logic berat
    if (order.status === "success" || order.status === "processing") {
      return { status: "ignored", message: "Order already processed." };
    }

    // --- C. Tentukan Status Baru ---
    let paymentSuccess = false;
    let newStatus = order.status;

    if (transaction_status === "capture") {
      if (fraud_status === "challenge") newStatus = "challenge";
      else if (fraud_status === "accept") paymentSuccess = true;
    } else if (transaction_status === "settlement") {
      paymentSuccess = true;
    } else if (["cancel", "deny", "expire"].includes(transaction_status)) {
      newStatus = "failed";
    }

    // Jika pembayaran Gagal/Pending, update status saja lalu return
    if (!paymentSuccess) {
      if (newStatus !== order.status) {
        await prisma.order.update({
          where: { id: order_id },
          data: { status: newStatus },
        });
      }
      return { status: "updated", message: `Status updated to ${newStatus}` };
    }

    // --- D. Pembayaran LUNAS -> Proses ke Provider (VIP) ---
    // Update ke 'processing' dulu (Locking mechanism)
    await prisma.order.update({
      where: { id: order_id },
      data: { status: "processing" },
    });

    try {
      // Panggil VIP Service
      const trxVip = await vipService.transaction(
        order.id,
        order.product.vipCode, // Kode produk di VIP (misal: ML10)
        order.playerId,
        order.serverZone
      );

      if (trxVip.result) {
        // SUKSES! Barang terkirim
        await prisma.order.update({
          where: { id: order_id },
          data: {
            status: "success",
            vipTrxId: trxVip.data.trxid,
            note: "Transaction Success",
          },
        });
        return { status: "success", message: "Order fulfilled successfully." };
      } else {
        // GAGAL di Provider (Saldo User Aman, tapi barang nyangkut)
        // Di sini bisa ditambahkan logic Refund otomatis ke saldo website jika mau
        await prisma.order.update({
          where: { id: order_id },
          data: {
            status: "manual_check", // Set ke manual check agar Admin sadar
            note: `Provider Error: ${trxVip.message}`,
          },
        });
        return {
          status: "error",
          message: "Payment success but Provider failed.",
        };
      }
    } catch (error) {
      console.error("[Order Service] Provider Execution Failed:", error);
      await prisma.order.update({
        where: { id: order_id },
        data: {
          status: "manual_check",
          note: "System Error during fulfillment",
        },
      });
      throw error;
    }
  },

  /**
   * Mengambil riwayat order milik user tertentu.
   */
  getUserHistory: async (userId) => {
    return await prisma.order.findMany({
      where: { userId },
      include: { product: { include: { game: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Mengambil detail satu order (Secure check).
   */
  getOrderDetail: async (orderId, userId = null) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: { include: { game: true } } },
    });

    if (!order) return null;

    // Jika userId diberikan, pastikan dia pemiliknya
    if (userId && order.userId !== userId) {
      throw new Error("Unauthorized access to order detail.");
    }

    return order;
  },
};

module.exports = orderService;
