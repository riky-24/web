import { useState, useEffect } from "react";
import api from "../services/api";
import GameCard from "../components/GameCard";
import { FaGamepad, FaSearch } from "react-icons/fa";

function Home() {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Kategori hardcoded dulu (bisa juga diambil dari DB unique categories)
  const categories = ["All", "MOBA", "Battle Royale", "RPG", "FPS"];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await api.get("/games");
        setGames(response.data.data);
        setFilteredGames(response.data.data);
      } catch (error) {
        console.error("Gagal mengambil game:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  // Logic Filtering (Kategori & Search)
  useEffect(() => {
    let result = games;

    // 1. Filter by Category
    if (activeCategory !== "All") {
      result = result.filter(
        (game) => game.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // 2. Filter by Search
    if (search) {
      result = result.filter((game) =>
        game.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredGames(result);
  }, [activeCategory, search, games]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section Sederhana */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Top Up Game Favoritmu
          </h1>
          <p className="text-blue-100 mb-8 text-lg">
            Proses cepat, aman, dan terpercaya 24 Jam.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Cari game..."
              className="w-full pl-12 pr-4 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 pb-20">
        {/* Category Tabs */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex overflow-x-auto gap-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Game Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-xl"></div>
            ))}
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <FaGamepad className="mx-auto text-4xl mb-3 opacity-20" />
            <p>Game tidak ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
