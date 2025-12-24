const { prisma } = require("../config/database");
const midtransService = require("./midtransService");
const vipService = require("./vipResellerService");

// Import Config & Utils (Pasukan Khusus)
const { serverKey } = require("../config/midtrans");
const { createSHA512, compareSafe } = require("../utils/cryptoHelper");
const { generateTrxId } = require("../utils/stringHelper");

const orderService = {
  /**
   * 1. MEMBUAT TRANSAKSI BARU (Checkout)
   * Integrasi: DB Lokal -> Generate TrxID -> Midtrans Snap
   */
  createTransaction: async (user, orderData) => {
    const { productId, gameUserId, zoneId, method } = orderData;

    // A. Validasi Product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { game: true },
    });

    if (!product) throw new Error("Produk tidak ditemukan.");

    // B. Generate ID Transaksi Unik (Standardized by StringHelper)
    // Contoh Output: TRX-170889922-123 (Konsisten & Rapi)
    const trxId = generateTrxId();

    // C. Buat Record Order di Database (Status: Pending)
    // Kita simpan di DB dulu sebelum minta token ke Midtrans biar aman
    const newOrder = await prisma.order.create({
      data: {
        trxId: trxId, // Identitas unik pesanan
        userId: user ? user.id : null, // Support Guest (User null)
        productId: product.id,
        playerId: gameUserId,
        serverZone: zoneId || "",
        amount: product.price, // Harga diambil aman dari DB, bukan dari input user
        status: "pending",
        paymentMethod: method || "qris",
      },
    });

    // D. Siapkan Data untuk Midtrans Snap
    const itemDetails = [
      {
        id: product.id,
        price: product.price,
        quantity: 1,
        name: `${product.game.name} - ${product.name}`.substring(0, 50), // Midtrans punya limit panjang nama
      },
    ];

    const customerDetails = {
      first_name: user ? user.username : "Guest User",
      email: user ? user.email : "guest@store.com",
    };

    // E. Request Token Pembayaran ke Midtrans Service
    // Kita kirim newOrder.id (UUID/Int) sebagai order_id di sistem Midtrans
    const midtransData = await midtransService.createTransaction(
      newOrder.id,
      newOrder.amount,
      customerDetails,
      itemDetails
    );

    // F. Update Order dengan Token & Redirect URL
    await prisma.order.update({
      where: { id: newOrder.id },
      data: {
        paymentUrl: midtransData.redirect_url,
        midtransTrxId: midtransData.token,
      },
    });

    return {
      orderId: newOrder.id,
      trxId: newOrder.trxId,
      snapToken: midtransData.token,
      paymentUrl: midtransData.redirect_url,
    };
  },

  /**
   * 2. MEMPROSES NOTIFIKASI PEMBAYARAN (WEBHOOK)
   * Menangani callback dari Midtrans, validasi keamanan, dan eksekusi order ke Provider.
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

    // ============================================================
    // SECURITY CHECK: Validasi Signature
    // Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
    // ============================================================

    // Pastikan gross_amount menjadi string agar konkatenasi benar
    const dataString = `${order_id}${status_code}${gross_amount}${serverKey}`;

    // Buat hash lokal menggunakan Utils
    const mySignature = createSHA512(dataString);

    // Bandingkan hash lokal vs hash dari Midtrans (Anti-Timing Attack via Utils)
    const isValid = compareSafe(signature_key, mySignature);

    if (!isValid) {
      console.warn(`[SECURITY ALERT] Invalid Signature for Order ${order_id}`);
      throw new Error("Invalid Signature! Potential hacking attempt.");
    }

    // --- B. Cek Data Order di Database ---
    const order = await prisma.order.findUnique({
      where: { id: order_id }, // Pastikan tipe data cocok (String/Int)
      include: { product: true },
    });

    if (!order) throw new Error("Order not found in database.");

    // Idempotency: Jika sudah sukses/processing, jangan diproses ulang (cegah double topup)
    if (order.status === "success" || order.status === "processing") {
      return { status: "ignored", message: "Order already processed." };
    }

    // --- C. Analisa Status Pembayaran ---
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

    // Jika pembayaran BELUM sukses (Gagal/Pending), update status saja & selesai.
    if (!paymentSuccess) {
      if (newStatus !== order.status) {
        await prisma.order.update({
          where: { id: order_id },
          data: { status: newStatus },
        });
      }
      return { status: "updated", message: `Status updated to ${newStatus}` };
    }

    // ============================================================
    // PEMBAYARAN LUNAS -> EKSEKUSI KE PROVIDER (VIP)
    // ============================================================

    // 1. Set status ke 'processing' (Locking agar tidak ada race condition)
    await prisma.order.update({
      where: { id: order_id },
      data: { status: "processing" },
    });

    console.log(
      `[ORDER] Processing Topup for ${order.trxId} - ${order.product.name}`
    );

    try {
      // 2. Tembak API VIP Reseller
      const trxVip = await vipService.transaction(
        order.trxId, // Gunakan TrxId kita sebagai RefID di VIP
        order.product.vipCode, // Kode produk (misal: ML86)
        order.playerId,
        order.serverZone
      );

      if (trxVip.result) {
        // 3. SUKSES: Update DB
        await prisma.order.update({
          where: { id: order_id },
          data: {
            status: "success",
            vipTrxId: trxVip.data.trxid, // ID Transaksi dari VIP
            note: "Transaction Success",
          },
        });
        return { status: "success", message: "Order fulfilled successfully." };
      } else {
        // 4. GAGAL DI PROVIDER (Saldo user aman, tapi barang gagal kirim)
        console.error(
          `[PROVIDER FAIL] Order ${order.trxId}: ${trxVip.message}`
        );

        await prisma.order.update({
          where: { id: order_id },
          data: {
            status: "manual_check", // Butuh penanganan Admin/Refund otomatis
            note: `Provider Error: ${trxVip.message}`,
          },
        });
        return {
          status: "error",
          message: "Payment success but Provider failed.",
        };
      }
    } catch (error) {
      console.error("[EXECUTION ERROR]", error);
      // Jika error koneksi/timeout saat nembak VIP
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
   * 3. RIWAYAT ORDER USER
   */
  getUserHistory: async (userId) => {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        product: {
          select: { name: true, game: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * 4. DETAIL ORDER (Untuk Halaman Bukti Pembelian)
   */
  getOrderDetail: async (orderId, userId = null) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: { include: { game: true } },
      },
    });

    if (!order) return null;

    // Security Check: Jika userId disuplai, pastikan dia pemiliknya
    if (userId && order.userId !== userId) {
      throw new Error("Unauthorized access to order detail.");
    }

    return order;
  },
};

module.exports = orderService;
