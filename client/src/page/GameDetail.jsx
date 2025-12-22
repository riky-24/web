import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaCheckCircle, FaGamepad, FaIdCard } from "react-icons/fa"; // Pastikan install react-icons
import api from "../services/api";

const GameDetail = () => {
  const { slug } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Form
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState(""); // Khusus Mobile Legends
  const [selectedProduct, setSelectedProduct] = useState(null);

  // State Cek ID
  const [checkingId, setCheckingId] = useState(false);
  const [nickname, setNickname] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Load Data Game saat halaman dibuka
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await api.get(`/games/${slug}`);
        setGame(res.data.data);
      } catch (err) {
        console.error("Gagal load game:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [slug]);

  // 2. Fungsi Cek ID ke Backend
  const handleCheckId = async () => {
    if (!userId) return setErrorMsg("User ID harus diisi!");

    setCheckingId(true);
    setErrorMsg("");
    setNickname(null);

    try {
      const res = await api.post("/games/check-id", {
        slug: game.slug,
        userId,
        zoneId,
      });

      // Jika sukses, backend kirim username
      if (res.data.status === "success") {
        // Parsing nama sesuai format response VIP (kadang string langsung, kadang object)
        const validName = res.data.data.username || res.data.data;
        setNickname(validName);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "ID tidak ditemukan / Salah.");
    } finally {
      setCheckingId(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!game)
    return <div className="p-10 text-center">Game tidak ditemukan</div>;

  const isMLBB = game.slug === "mobile-legends";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Banner Header */}
      <div className="bg-blue-600 h-48 relative">
        <div className="absolute -bottom-12 left-0 right-0 max-w-4xl mx-auto px-4 flex items-end gap-6">
          <img
            src={game.image}
            alt={game.name}
            className="w-32 h-32 rounded-2xl shadow-lg border-4 border-white bg-white object-cover"
          />
          <div className="mb-4 text-white">
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <p className="text-blue-100">{game.publisher}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kolom Kiri: Input ID */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Input Data Akun */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4 border-b pb-3">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <FaIdCard />
              </span>
              <h2 className="font-bold text-gray-800">1. Masukkan User ID</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">
                  User ID
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 12345678"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              {isMLBB && (
                <div className="col-span-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Zone ID
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1234"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Tombol Cek ID */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">Pastikan ID Anda benar.</p>
              <button
                onClick={handleCheckId}
                disabled={checkingId || !userId}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                {checkingId ? "Mengecek..." : "Cek ID"}
              </button>
            </div>

            {/* Hasil Cek Nickname */}
            {nickname && (
              <div className="mt-4 bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200 flex items-center gap-2">
                <FaCheckCircle /> Valid: <strong>{nickname}</strong>
              </div>
            )}
            {errorMsg && (
              <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 text-sm">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Card 2: Pilih Nominal */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4 border-b pb-3">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <FaGamepad />
              </span>
              <h2 className="font-bold text-gray-800">2. Pilih Nominal</h2>
            </div>

            {/* ... Bagian atas sama ... */}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {game.products.map((product) => {
                // Logic Cek Diskon
                // Diskon aktif jika discountPrice ada (tidak null) DAN < price
                const hasDiscount =
                  product.discountPrice &&
                  product.discountPrice < product.price;
                const finalPrice = hasDiscount
                  ? product.discountPrice
                  : product.price;

                return (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`relative cursor-pointer border rounded-xl p-4 transition-all hover:shadow-md ${
                      selectedProduct?.id === product.id
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {/* Badge Promo (Jika Diskon) */}
                    {hasDiscount && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                        PROMO
                      </div>
                    )}

                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {product.name}
                    </h3>

                    <div className="flex flex-col">
                      {/* Harga Coret */}
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                      )}

                      {/* Harga Final */}
                      <span
                        className={`font-bold ${
                          hasDiscount ? "text-red-500" : "text-blue-600"
                        }`}
                      >
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ... Bagian bawah sama ... */}
          </div>
        </div>

        {/* Kolom Kanan: Checkout (Sederhana dulu) */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Detail Pembayaran</h3>
            {selectedProduct ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Item:</span>
                  <span className="font-medium">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Harga:</span>
                  <span className="font-medium">
                    Rp {selectedProduct.price.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      Rp {selectedProduct.price.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  disabled={!nickname} // Wajib Cek ID dulu baru bisa beli
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {nickname ? "Beli Sekarang" : "Cek ID Dulu"}
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-10 text-sm">
                Silakan pilih item terlebih dahulu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
