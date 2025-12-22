import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api"; // Pastikan path ini benar
import {
  FaSearch,
  FaGamepad,
  FaShieldAlt,
  FaRocket,
  FaFire,
  FaBullhorn,
  FaClock,
  FaCheckCircle,
  FaUsers,
} from "react-icons/fa";

export default function Home() {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // State Search & Banner
  const [search, setSearch] = useState("");
  const [currentBanner, setCurrentBanner] = useState(0);

  // Data Dummy untuk UI "Ramai"
  const banners = [
    {
      id: 1,
      title: "Mobile Legends Promo",
      desc: "Top Up Diamonds Bonus 10% Hari Ini!",
      color: "from-blue-600 to-indigo-900",
      image:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Free Fire Booyah",
      desc: "Harga Termurah Se-Indonesia Raya.",
      color: "from-orange-500 to-red-900",
      image:
        "https://images.unsplash.com/photo-1593305841991-05c29736560e?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "Valorant Points",
      desc: "Instant Delivery 24 Jam Non-Stop.",
      color: "from-rose-500 to-pink-900",
      image:
        "https://images.unsplash.com/photo-1624138784181-dc7cc754e0b1?q=80&w=2070&auto=format&fit=crop",
    },
  ];

  const liveTransactions = [
    "🔥 Budi barusan Top Up 86 DM MLBB",
    "⚡ Siti sukses beli 140 DM Free Fire",
    "🔥 Agus menyambar 1000 VP Valorant",
    "⚡ Rian baru saja Checkout Starlight Member",
    "🔥 Dinda sukses Top Up Genshin Impact",
  ];

  const categories = [
    { id: "All", label: "Semua", icon: <FaGamepad /> },
    { id: "MOBA", label: "MOBA", icon: <FaShieldAlt /> },
    { id: "FPS", label: "FPS", icon: <FaRocket /> },
    { id: "RPG", label: "RPG", icon: <FaFire /> },
  ];

  // 1. Fetch Data (FIXED: Menggunakan api.get bukan gameAPI)
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await api.get("/games");
        // Validasi struktur response backend kita
        if (response.data && response.data.data) {
          setGames(response.data.data);
          setFilteredGames(response.data.data);
        } else {
          // Fallback jika format beda
          setGames(response.data);
          setFilteredGames(response.data);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  // 2. Auto-Play Banner Slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // 3. Logic Filter & Search
  useEffect(() => {
    let result = games || [];
    if (activeCategory !== "All") {
      result = result.filter(
        (g) => g.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    if (search) {
      result = result.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredGames(result);
  }, [activeCategory, search, games]);

  const handleSearchChange = (e) => {
    if (/^[a-zA-Z0-9\s-]*$/.test(e.target.value)) setSearch(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans overflow-x-hidden flex flex-col">
      {/* Navbar Placeholder (Sementara Hardcode biar gak error) */}
      <nav className="bg-slate-900 border-b border-white/10 p-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-500">GAME TOPUP</h1>
          <div className="space-x-4">
            <Link to="/login" className="text-sm font-bold hover:text-blue-400">
              Masuk
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700"
            >
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      {/* --- 1. LIVE NOTIFICATION BAR (MARQUEE) --- */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-900 border-b border-white/5 py-2 overflow-hidden relative z-30">
        <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
          {[...liveTransactions, ...liveTransactions].map((trx, idx) => (
            <span
              key={idx}
              className="flex items-center gap-2 text-xs font-bold text-blue-200 mx-4"
            >
              <FaBullhorn className="text-yellow-400" /> {trx}
            </span>
          ))}
        </div>
      </div>

      {/* --- 2. HERO CAROUSEL SECTION --- */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden group">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentBanner ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${banner.image})` }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-80 mix-blend-multiply`}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex flex-col justify-center pt-10 text-center md:text-left">
              <span className="inline-block w-fit mx-auto md:mx-0 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-yellow-300 text-xs font-bold mb-4">
                🔥 PROMO SPESIAL HARI INI
              </span>
              <h1 className="text-4xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl mb-4">
                {banner.title}
              </h1>
              <p className="text-lg text-slate-200 max-w-xl mx-auto md:mx-0 font-medium">
                {banner.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* --- 3. SEARCH BAR (Floating) --- */}
      <div className="relative z-30 -mt-8 px-4">
        <div className="max-w-2xl mx-auto bg-slate-800/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center ring-4 ring-slate-900">
          <FaSearch className="text-slate-400 ml-4 text-xl" />
          <input
            type="text"
            placeholder="Mau Top Up apa? Ketik disini..."
            className="w-full bg-transparent border-none text-white placeholder-slate-400 h-12 px-4 focus:ring-0 text-lg font-medium outline-none"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* --- 4. STATS --- */}
      <div className="max-w-6xl mx-auto px-4 mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <FaUsers className="mx-auto text-blue-500 text-2xl mb-2" />
          <h3 className="text-xl font-black text-white">15.2K+</h3>
          <p className="text-slate-400 text-xs">Gamers Aktif</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <FaCheckCircle className="mx-auto text-green-500 text-2xl mb-2" />
          <h3 className="text-xl font-black text-white">99.9%</h3>
          <p className="text-slate-400 text-xs">Sukses</p>
        </div>
        <div className="col-span-2 bg-gradient-to-r from-red-600 to-rose-600 rounded-xl p-4 flex items-center justify-between text-white relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaClock className="animate-spin" />
              <span className="font-bold text-xs tracking-widest text-red-200">
                FLASH SALE
              </span>
            </div>
            <h3 className="text-2xl font-black italic">05 : 23 : 45</h3>
          </div>
          <FaFire className="text-5xl text-white/20" />
        </div>
      </div>

      {/* --- 5. GAME GRID --- */}
      <main className="max-w-7xl mx-auto px-4 py-16 w-full flex-grow">
        {/* Category Tabs */}
        <div className="flex justify-center gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300
                ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }
              `}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-slate-800 rounded-2xl animate-pulse border border-slate-700"
              ></div>
            ))}
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {filteredGames.map((game) => (
              <Link
                key={game.id}
                to={`/game/${game.slug}`}
                className="group relative block bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/20"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold">
                    {game.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-xs text-slate-500">{game.publisher}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-800/30 rounded-3xl border border-slate-700 border-dashed">
            <FaGamepad className="mx-auto text-6xl text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-300">
              Game Tidak Ditemukan
            </h3>
          </div>
        )}
      </main>

      {/* Footer Simple */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 text-center text-slate-500 text-sm mt-auto">
        <p>&copy; 2025 Game Topup Store. Aman & Terpercaya.</p>
      </footer>

      {/* Styles for Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
