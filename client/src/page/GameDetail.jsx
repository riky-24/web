import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Swal from "sweetalert2";
import {
  FaBolt,
  FaGamepad,
  FaIdCard,
  FaWallet,
  FaCheckCircle,
  FaGem,
  FaCoins,
  FaDiceD20,
  FaFire,
  FaShapes,
  FaMoneyBillWave,
  FaUserCheck,
  FaWhatsapp,
  FaQrcode,
  FaCreditCard,
  FaTimes,
  FaChevronRight,
  FaInfoCircle,
  FaArrowRight, // <--- TAMBAH ICON INI
} from "react-icons/fa";

// --- 1. HELPER ICON ---
const getGameCurrencyIcon = (slug) => {
  const s = slug?.toLowerCase() || "";
  if (s.includes("mobile-legends") || s.includes("free-fire"))
    return <FaGem className="text-blue-400 drop-shadow-md" />;
  if (s.includes("pubg"))
    return <FaCoins className="text-yellow-400 drop-shadow-md" />;
  if (s.includes("valorant"))
    return <FaDiceD20 className="text-red-400 drop-shadow-md" />;
  if (s.includes("genshin"))
    return <FaShapes className="text-purple-400 drop-shadow-md" />;
  return <FaFire className="text-orange-400 drop-shadow-md" />;
};

// --- DATA PEMBAYARAN ---
const PAYMENT_CHANNELS = [
  {
    id: "SALDO",
    name: "Saldo Akun",
    icon: <FaWallet />,
    feeFlat: 0,
    feePercent: 0,
  },
  {
    id: "QRIS",
    name: "QRIS (All Payment)",
    icon: <FaQrcode />,
    feeFlat: 750,
    feePercent: 0.7,
  },
  { id: "DANA", name: "DANA", icon: <FaWallet />, feeFlat: 0, feePercent: 1.5 },
  {
    id: "VA_BCA",
    name: "Virtual Account BCA",
    icon: <FaCreditCard />,
    feeFlat: 4500,
    feePercent: 0,
  },
];

const GameDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [nickname, setNickname] = useState(null);
  const [isCheckingId, setIsCheckingId] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [contactWA, setContactWA] = useState("");

  const [showSummary, setShowSummary] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const productSectionRef = useRef(null);
  const paymentSectionRef = useRef(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await api.get(`/games/${slug}`);
        setGame(response.data.data);
        setProducts(response.data.data.products || []);
      } catch (error) {
        Swal.fire("Error", "Gagal memuat data game.", "error");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [slug, navigate]);

  // --- FITUR BARU: POPUP CARA BELI ---
  const showTutorial = () => {
    Swal.fire({
      title: `<span class="text-2xl font-black text-white">Cara Topup?</span>`,
      html: `
        <div class="text-left text-slate-300 space-y-4 px-2">
          <div class="flex items-start gap-3">
            <div class="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mt-1 shrink-0">1</div>
            <p><strong class="text-white">Masukkan ID Game</strong><br/><span class="text-xs">Isi User ID & Zone ID (jika ada). Klik tombol "Cek Nickname" untuk validasi.</span></p>
          </div>
          <div class="flex items-start gap-3">
            <div class="bg-pink-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mt-1 shrink-0">2</div>
            <p><strong class="text-white">Pilih Nominal</strong><br/><span class="text-xs">Pilih jumlah Diamond/Item yang diinginkan.</span></p>
          </div>
          <div class="flex items-start gap-3">
            <div class="bg-yellow-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mt-1 shrink-0">3</div>
            <p><strong class="text-white">Pilih Pembayaran</strong><br/><span class="text-xs">Pilih metode bayar (QRIS, Saldo, dll).</span></p>
          </div>
          <div class="flex items-start gap-3">
            <div class="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mt-1 shrink-0">4</div>
            <p><strong class="text-white">Konfirmasi & Bayar</strong><br/><span class="text-xs">Masukkan No WA, klik Beli, dan selesaikan pembayaran.</span></p>
          </div>
        </div>
      `,
      background: "#1e293b",
      confirmButtonText: "Siap, Paham!",
      confirmButtonColor: "#2563eb",
      customClass: {
        popup: "rounded-3xl border border-slate-700 shadow-2xl",
      },
    });
  };
  // -----------------------------------

  const handleCheckNickname = async () => {
    if (!userId) return Swal.fire("Gagal", "Masukkan User ID dulu!", "warning");
    setIsCheckingId(true);
    setNickname(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setNickname("SultanTopup_88");
      setTimeout(() => {
        productSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
    } catch (error) {
      Swal.fire("Gagal", "ID Player tidak ditemukan.", "error");
    } finally {
      setIsCheckingId(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedProduct || !selectedPayment) return 0;
    const price = selectedProduct.price;
    const feeFlat = selectedPayment.feeFlat;
    const feePercent = Math.ceil(price * (selectedPayment.feePercent / 100));
    return price + feeFlat + feePercent;
  };

  const openSummary = () => {
    if (!userId)
      return Swal.fire("Langkah 1", "Masukkan User ID Anda!", "warning").then(
        () => document.getElementById("input-id").focus()
      );
    if (!nickname)
      return Swal.fire(
        "Langkah 1",
        "Silakan klik tombol CEK ID dulu.",
        "warning"
      );
    if (!selectedProduct)
      return Swal.fire("Langkah 2", "Pilih nominal topup!", "warning");
    if (!selectedPayment)
      return Swal.fire("Langkah 3", "Pilih metode pembayaran!", "warning");
    if (!contactWA)
      return Swal.fire(
        "Langkah 4",
        "Masukkan No WA untuk invoice!",
        "warning"
      ).then(() => document.getElementById("input-wa").focus());

    setShowSummary(true);
  };

  const handleOrderProcess = async () => {
    setOrderLoading(true);
    try {
      await api.post("/orders", {
        productId: selectedProduct.id,
        userId: userId,
        zoneId: zoneId,
        paymentMethod: selectedPayment.id,
        contactInfo: contactWA,
      });

      setShowSummary(false);
      Swal.fire({
        title: "Pesanan Dibuat!",
        text: "Silakan selesaikan pembayaran.",
        icon: "success",
        background: "#1e293b",
        color: "#fff",
        confirmButtonColor: "#2563eb",
      }).then(() => navigate("/profile"));
    } catch (error) {
      Swal.fire({
        title: "Gagal!",
        text: error.response?.data?.message || "Error sistem.",
        icon: "error",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const onSelectProduct = (item) => {
    setSelectedProduct(item);
    if (window.innerWidth < 768) {
      setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );

  const CurrencyIcon = getGameCurrencyIcon(game.slug);
  const totalPrice = calculateTotal();

  return (
    <div className="min-h-screen bg-[#0F172A] pb-32 relative">
      {/* --- HERO HEADER --- */}
      <div className="relative h-[220px] md:h-[350px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm opacity-40"
          style={{ backgroundImage: `url(${game.thumbnail})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 container mx-auto flex items-end gap-4 md:gap-8 z-10">
          <img
            src={game.thumbnail}
            alt={game.name}
            className="w-24 h-24 md:w-44 md:h-44 rounded-2xl shadow-2xl border-2 md:border-4 border-slate-700 object-cover"
          />
          <div className="mb-2 w-full">
            <h1 className="text-2xl md:text-5xl font-black text-white uppercase drop-shadow-lg leading-tight">
              {game.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-blue-600/20 text-blue-400 text-[10px] md:text-sm px-3 py-1 rounded-full border border-blue-600/30 font-bold flex items-center gap-1">
                <FaBolt /> Instant
              </span>
              <span className="bg-green-600/20 text-green-400 text-[10px] md:text-sm px-3 py-1 rounded-full border border-green-600/30 font-bold flex items-center gap-1">
                <FaCheckCircle /> Resmi
              </span>

              {/* --- TOMBOL CARA BELI (BARU) --- */}
              <button
                onClick={showTutorial}
                className="bg-slate-700/50 hover:bg-slate-600 text-white text-[10px] md:text-sm px-3 py-1 rounded-full border border-slate-500 font-bold flex items-center gap-1 transition-colors ml-auto md:ml-0"
              >
                <FaInfoCircle className="text-yellow-400" /> Cara Beli ?
              </button>
              {/* --------------------------------- */}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* KOLOM KIRI (FORM) */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: DATA AKUN */}
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-5 md:p-6 relative">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-700/50 pb-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-500/30">
                1
              </span>
              <h2 className="text-lg md:text-xl font-bold text-white">
                Data Akun
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">
                  User ID
                </label>
                <input
                  id="input-id"
                  type="tel"
                  placeholder="ID"
                  className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-xl focus:border-blue-500 focus:outline-none font-mono font-bold text-sm md:text-base"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setNickname(null);
                  }}
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">
                  Zone ID (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder="Zone"
                  className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-xl focus:border-blue-500 focus:outline-none font-mono font-bold text-sm md:text-base"
                  value={zoneId}
                  onChange={(e) => setNickname(null)}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <button
                onClick={handleCheckNickname}
                disabled={isCheckingId || !userId}
                className="w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
              >
                {isCheckingId ? (
                  <span className="animate-spin text-lg">⟳</span>
                ) : (
                  <FaUserCheck />
                )}
                {isCheckingId ? "Mengecek..." : "Cek Nickname"}
              </button>

              {nickname && (
                <div className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-xl border border-green-500/20 animate-fade-in text-sm">
                  <FaCheckCircle />{" "}
                  <span className="font-bold">{nickname}</span>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: PILIH PRODUK */}
          <div
            ref={productSectionRef}
            className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-5 md:p-6"
          >
            <div className="flex items-center gap-3 mb-4 border-b border-slate-700/50 pb-3">
              <span className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-pink-500/30">
                2
              </span>
              <h2 className="text-lg md:text-xl font-bold text-white">
                Pilih Nominal
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct(item)}
                  className={`relative cursor-pointer p-3 md:p-4 rounded-xl border transition-all duration-200 group flex flex-col justify-between h-full min-h-[100px]
                     ${
                       selectedProduct?.id === item.id
                         ? "bg-gradient-to-br from-blue-600/30 to-blue-900/30 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)] transform scale-[1.02]"
                         : "bg-slate-900 border-slate-700 hover:border-slate-500"
                     }`}
                >
                  {selectedProduct?.id === item.id && (
                    <div className="absolute top-2 right-2 text-blue-400 text-xs">
                      <FaCheckCircle />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        selectedProduct?.id === item.id
                          ? "bg-blue-500/20"
                          : "bg-slate-800"
                      }`}
                    >
                      {CurrencyIcon}
                    </div>
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-xs md:text-sm leading-tight ${
                        selectedProduct?.id === item.id
                          ? "text-white"
                          : "text-slate-200"
                      }`}
                    >
                      {item.name}
                    </h3>
                    <p className="text-slate-400 text-[10px] md:text-xs mt-1">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3: METODE PEMBAYARAN */}
          <div
            ref={paymentSectionRef}
            className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-5 md:p-6"
          >
            <div className="flex items-center gap-3 mb-4 border-b border-slate-700/50 pb-3">
              <span className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-yellow-500/30">
                3
              </span>
              <h2 className="text-lg md:text-xl font-bold text-white">
                Pembayaran
              </h2>
            </div>

            <div className="space-y-2.5">
              {PAYMENT_CHANNELS.map((pay) => (
                <div
                  key={pay.id}
                  onClick={() => setSelectedPayment(pay)}
                  className={`cursor-pointer p-3 md:p-4 rounded-xl border flex items-center justify-between transition-all active:scale-[0.99]
                   ${
                     selectedPayment?.id === pay.id
                       ? "bg-yellow-600/10 border-yellow-500 ring-1 ring-yellow-500/50"
                       : "bg-slate-900 border-slate-700 hover:bg-slate-800"
                   }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-lg flex items-center justify-center text-xl md:text-2xl text-slate-300">
                      {pay.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs md:text-base">
                        {pay.name}
                      </h4>
                      <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                        {pay.feePercent === 0 && pay.feeFlat === 0
                          ? "Bebas Biaya Admin"
                          : `Fee: ${
                              pay.feeFlat > 0 ? `+Rp ${pay.feeFlat}` : ""
                            } ${
                              pay.feePercent > 0 ? `+${pay.feePercent}%` : ""
                            }`}
                      </p>
                    </div>
                  </div>
                  {selectedPayment?.id === pay.id ? (
                    <FaCheckCircle className="text-yellow-500 text-lg md:text-xl" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-600"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4: KONTAK */}
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-5 md:p-6 mb-8">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-700/50 pb-3">
              <span className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-green-500/30">
                4
              </span>
              <h2 className="text-lg md:text-xl font-bold text-white">
                Kontak
              </h2>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <FaWhatsapp className="absolute left-4 top-3.5 text-green-500 text-lg" />
                <input
                  id="input-wa"
                  type="tel"
                  placeholder="0812xxxx"
                  className="w-full pl-11 p-3 bg-slate-900 border border-slate-600 text-white rounded-xl focus:border-green-500 focus:outline-none font-bold text-sm"
                  value={contactWA}
                  onChange={(e) => setContactWA(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 ml-1 flex items-center gap-1">
                <FaCheckCircle className="text-slate-600" /> Bukti transaksi
                dikirim ke nomor ini.
              </p>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (DESKTOP SUMMARY) */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-6 sticky top-24 shadow-2xl backdrop-blur-md">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-green-500" /> Ringkasan
            </h3>

            <div className="space-y-3 text-sm text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <SummaryRow label="Game" value={game.name} />
              <SummaryRow
                label="Item"
                value={selectedProduct ? selectedProduct.name : "-"}
              />
              <SummaryRow
                label="Harga"
                value={
                  selectedProduct
                    ? `Rp ${selectedProduct.price.toLocaleString("id-ID")}`
                    : "-"
                }
              />
              <SummaryRow
                label="Fee"
                value={
                  selectedPayment && totalPrice - selectedProduct?.price > 0
                    ? `Rp ${(
                        totalPrice - selectedProduct?.price
                      ).toLocaleString()}`
                    : "Rp 0"
                }
              />

              <div className="border-t border-slate-600 pt-3 mt-2 flex justify-between items-center">
                <span className="font-bold text-white">Total</span>
                <span className="font-black text-xl text-blue-400">
                  {totalPrice > 0
                    ? `Rp ${totalPrice.toLocaleString("id-ID")}`
                    : "-"}
                </span>
              </div>
            </div>

            <button
              onClick={openSummary}
              className="w-full mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <FaWallet /> Beli Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER MOBILE (Floating App Bar) */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[#0F172A]/90 backdrop-blur-lg border-t border-slate-800 p-3 px-4 z-40 pb-6 safe-area-pb">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Total Pembayaran
            </span>
            <span className="text-lg font-black text-white leading-none">
              {totalPrice > 0
                ? `Rp ${totalPrice.toLocaleString("id-ID")}`
                : "Rp 0"}
            </span>
          </div>
          <button
            onClick={openSummary}
            className="flex-1 max-w-[180px] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 text-sm flex items-center justify-center gap-2"
          >
            Beli Sekarang <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>

      {/* MODAL CONFIRMATION */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSummary(false)}
          ></div>
          <div className="relative bg-slate-800 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-black text-white">Konfirmasi</h2>
              <button
                onClick={() => setShowSummary(false)}
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-all"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700/50 space-y-3">
                <DetailRow label="Nickname" value={nickname} isHighlight />
                <DetailRow
                  label="ID Akun"
                  value={`${userId} ${zoneId ? `(${zoneId})` : ""}`}
                />
                <DetailRow label="Item" value={selectedProduct?.name} />
                <DetailRow label="Metode" value={selectedPayment?.name} />
                <DetailRow label="No. WA" value={contactWA} />
                <div className="border-t border-dashed border-slate-600 my-3"></div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Harga Item</span>
                  <span className="text-white font-medium">
                    Rp {selectedProduct?.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Biaya Admin</span>
                  <span className="text-white font-medium">
                    Rp {(totalPrice - selectedProduct?.price).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center bg-blue-600/10 p-4 rounded-xl border border-blue-500/20">
                <span className="text-blue-200 font-bold text-sm">
                  Total Bayar
                </span>
                <span className="text-2xl font-black text-blue-400">
                  Rp {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 bg-slate-900/50">
              <button
                onClick={handleOrderProcess}
                disabled={orderLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {orderLoading ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <FaCheckCircle />
                )}
                {orderLoading ? "Memproses..." : "KONFIRMASI BAYAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between text-xs">
    <span className="text-slate-400">{label}</span>
    <span className="font-bold text-white text-right max-w-[60%] truncate">
      {value}
    </span>
  </div>
);

const DetailRow = ({ label, value, isHighlight }) => (
  <div className="flex justify-between text-sm items-start">
    <span className="text-slate-400 min-w-[80px]">{label}</span>
    <span
      className={`text-right font-medium break-all ${
        isHighlight ? "text-green-400 font-bold" : "text-white"
      }`}
    >
      {value || "-"}
    </span>
  </div>
);

export default GameDetail;
