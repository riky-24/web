import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaIdCard,
  FaGamepad,
  FaWallet,
  FaShieldAlt,
  FaBolt,
  FaInfoCircle,
  FaStar,
} from "react-icons/fa";

const GameDetail = () => {
  const { slug } = useParams();

  // --- STATE MANAGEMENT ---
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Validation State
  const [checkingId, setCheckingId] = useState(false);
  const [nickname, setNickname] = useState(null);
  const [idError, setIdError] = useState("");

  // 1. FETCH DATA
  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/games/${slug}`);
        if (res.data && res.data.data) {
          setGame(res.data.data);
        } else {
          setError("Data game tidak ditemukan.");
        }
      } catch (err) {
        setError("Gagal memuat layanan. Silakan coba lagi nanti.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [slug]);

  // 2. INPUT SANITIZATION (Security: OWASP)
  const handleUserIdChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      // Hanya huruf & angka
      setUserId(value);
      if (nickname) setNickname(null);
      if (idError) setIdError("");
    }
  };

  const handleZoneIdChange = (e) => {
    const value = e.target.value;
    if (/^[0-9]*$/.test(value)) {
      setZoneId(value);
    }
  };

  // 3. CHECK ID LOGIC
  const handleCheckId = async () => {
    if (!userId) return setIdError("User ID wajib diisi.");

    setCheckingId(true);
    setIdError("");
    setNickname(null);

    try {
      const res = await api.post("/games/check-id", {
        slug: game.slug,
        userId,
        zoneId,
      });

      if (res.data.status === "success") {
        const validName = res.data.data.username || res.data.data;
        setNickname(validName);
      }
    } catch (err) {
      setIdError(err.response?.data?.message || "ID Player tidak ditemukan.");
    } finally {
      setCheckingId(false);
    }
  };

  // --- RENDER STATES ---
  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-400 font-bold animate-pulse">
            Memuat Data Game...
          </p>
        </div>
      </div>
    );

  if (error || !game)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <FaTimesCircle className="text-6xl text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Oops!</h2>
        <p className="text-slate-500 mt-2 max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );

  const isMLBB = game.slug === "mobile-legends";

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans pb-20">
      {/* --- HERO HEADER ANIMATED --- */}
      <div className="relative w-full h-[500px] overflow-hidden bg-slate-900">
        {/* 1. Dynamic Background Image (Parallax Effect) */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-60 scale-105 animate-[pulse_10s_ease-in-out_infinite]"
          style={{ backgroundImage: `url(${game.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FE] via-slate-900/60 to-slate-900/90"></div>
        </div>

        {/* 2. Content Overlay */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-8 pt-10">
          {/* Logo Game Mengambang (Floating Animation) */}
          <div className="relative group perspective">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2rem] blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={game.image}
              alt={game.name}
              className="relative w-40 h-40 md:w-52 md:h-52 rounded-[2rem] shadow-2xl border-4 border-white/10 bg-slate-800 object-cover transform transition duration-500 hover:scale-105 hover:rotate-2"
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <FaStar /> 5.0
            </div>
          </div>

          {/* Text Content Fade In */}
          <div className="text-center md:text-left space-y-4 max-w-2xl animate-[fadeIn_1s_ease-out]">
            <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg tracking-tight leading-tight">
              {game.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-medium text-slate-300">
              <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <FaShieldAlt className="text-blue-400" /> Official{" "}
                {game.publisher}
              </span>
              <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <FaBolt className="text-yellow-400" /> Proses Otomatis
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN FORM SECTION (Overlap Effect) --- */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 -mt-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: INPUT DATA */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden transform transition hover:-translate-y-1 duration-300">
            <div className="bg-gradient-to-r from-white to-slate-50 px-8 py-5 border-b border-slate-100 flex items-center gap-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg shadow-blue-200 shadow-lg">
                1
              </span>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">
                  Masukkan Data Akun
                </h2>
                <p className="text-xs text-slate-400">
                  Pastikan ID yang dimasukkan benar
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    User ID
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaIdCard className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-700"
                      placeholder="Contoh: 12345678"
                      value={userId}
                      onChange={handleUserIdChange}
                    />
                  </div>
                </div>

                {isMLBB && (
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                      Zone ID
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaGamepad className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-700"
                        placeholder="Contoh: 1234"
                        value={zoneId}
                        onChange={handleZoneIdChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <FaInfoCircle />
                  <span>Cek nickname anda</span>
                </div>

                {!nickname && (
                  <button
                    onClick={handleCheckId}
                    disabled={!userId || checkingId}
                    className="w-full sm:w-auto px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    {checkingId ? "Sedang Mengecek..." : "Cek Validasi ID"}
                  </button>
                )}
              </div>

              {/* Validation Result */}
              {nickname && (
                <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-4 animate-[fadeIn_0.5s_ease-out]">
                  <div className="bg-green-500 p-2 rounded-full text-white shadow-lg shadow-green-200">
                    <FaCheckCircle className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wide">
                      Valid Player
                    </p>
                    <p className="text-lg font-black text-slate-800">
                      {nickname}
                    </p>
                  </div>
                </div>
              )}

              {idError && (
                <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-4 animate-[fadeIn_0.5s_ease-out]">
                  <div className="bg-red-500 p-2 rounded-full text-white shadow-lg shadow-red-200">
                    <FaTimesCircle className="text-xl" />
                  </div>
                  <p className="text-sm font-bold text-red-600">{idError}</p>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: SELECT PRODUCT */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden transform transition hover:-translate-y-1 duration-300">
            <div className="bg-gradient-to-r from-white to-slate-50 px-8 py-5 border-b border-slate-100 flex items-center gap-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg shadow-blue-200 shadow-lg">
                2
              </span>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">
                  Pilih Nominal
                </h2>
                <p className="text-xs text-slate-400">
                  Pilih item yang ingin Anda beli
                </p>
              </div>
            </div>

            <div className="p-8">
              {game.products && game.products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {game.products.map((product) => {
                    const hasDiscount =
                      product.discountPrice &&
                      product.discountPrice < product.price;
                    const finalPrice = hasDiscount
                      ? product.discountPrice
                      : product.price;
                    const isSelected = selectedProduct?.id === product.id;

                    return (
                      <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`
                                        relative group cursor-pointer rounded-2xl p-4 transition-all duration-300 border-2 overflow-hidden
                                        ${
                                          isSelected
                                            ? "border-blue-500 bg-blue-50/50 shadow-blue-200 shadow-lg scale-[1.02]"
                                            : "border-slate-100 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1"
                                        }
                                    `}
                      >
                        {/* Efek Kilau saat Hover */}
                        <div className="absolute inset-0 bg-white/40 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                        {hasDiscount && (
                          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md z-10">
                            HEMAT{" "}
                            {Math.round(
                              ((product.price - finalPrice) / product.price) *
                                100
                            )}
                            %
                          </div>
                        )}

                        <h3
                          className={`relative z-10 text-sm font-bold mb-3 line-clamp-2 ${
                            isSelected ? "text-blue-700" : "text-slate-600"
                          }`}
                        >
                          {product.name}
                        </h3>

                        <div className="relative z-10 flex flex-col">
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through mb-0.5">
                              Rp {product.price.toLocaleString("id-ID")}
                            </span>
                          )}
                          <span
                            className={`text-lg font-black tracking-tight ${
                              hasDiscount
                                ? "text-red-500"
                                : isSelected
                                ? "text-blue-600"
                                : "text-slate-800"
                            }`}
                          >
                            Rp {finalPrice.toLocaleString("id-ID")}
                          </span>
                        </div>

                        {isSelected && (
                          <FaCheckCircle className="absolute bottom-3 right-3 text-blue-500 text-xl drop-shadow-sm z-10 animate-[bounce_1s_infinite]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-400 font-medium">
                    Belum ada produk tersedia.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (STICKY SUMMARY) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-white overflow-hidden ring-4 ring-slate-50">
              <div className="bg-slate-900 p-6 relative overflow-hidden">
                {/* Abstract Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-40 -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600 rounded-full blur-[40px] opacity-30 -ml-10 -mb-10"></div>

                <h3 className="relative z-10 font-bold text-lg text-white flex items-center gap-2">
                  <FaWallet className="text-blue-400" /> Ringkasan Order
                </h3>
              </div>

              <div className="p-6">
                {/* Detail Items */}
                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Game</span>
                    <span className="font-bold text-slate-700">
                      {game.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-start text-slate-500">
                    <span>Target ID</span>
                    <span className="font-bold text-slate-700 text-right font-mono">
                      {userId || "-"} {zoneId ? `(${zoneId})` : ""}
                    </span>
                  </div>

                  {nickname && (
                    <div className="bg-green-50 p-3 rounded-xl flex justify-between items-center border border-green-100 animate-[fadeIn_0.5s_ease-out]">
                      <span className="text-xs font-bold text-green-600 uppercase">
                        Nick
                      </span>
                      <span className="font-bold text-green-700 text-right truncate max-w-[120px]">
                        {nickname}
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-slate-100 border-t border-dashed border-slate-200 my-2"></div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span>Produk</span>
                    <span className="font-bold text-slate-700 text-right w-1/2 line-clamp-1">
                      {selectedProduct ? selectedProduct.name : "-"}
                    </span>
                  </div>
                </div>

                {/* Total Section */}
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-slate-500 font-bold text-sm mb-1">
                      Total Bayar
                    </span>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">
                      {selectedProduct
                        ? `Rp ${(
                            selectedProduct.discountPrice ||
                            selectedProduct.price
                          ).toLocaleString("id-ID")}`
                        : "Rp 0"}
                    </span>
                  </div>

                  <button
                    disabled={!selectedProduct || !nickname}
                    className={`
                                    w-full py-4 rounded-xl font-black text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group
                                    ${
                                      selectedProduct && nickname
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] hover:shadow-blue-500/40 cursor-pointer"
                                        : "bg-slate-200 text-slate-400 cursor-not-allowed grayscale"
                                    }
                                `}
                  >
                    {nickname ? (
                      <>
                        Beli Sekarang{" "}
                        <FaBolt className="group-hover:animate-ping" />
                      </>
                    ) : (
                      "Lengkapi Data Dulu"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white flex flex-col items-center text-center gap-2 shadow-sm">
                <FaShieldAlt className="text-blue-500 text-xl" />
                <span className="text-xs font-bold text-slate-600">
                  Garansi Layanan
                </span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white flex flex-col items-center text-center gap-2 shadow-sm">
                <FaCheckCircle className="text-green-500 text-xl" />
                <span className="text-xs font-bold text-slate-600">
                  Terpercaya
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
