import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import api from "./services/api";
import GameCard from "./components/GameCard";
import GameDetail from "./page/GameDetail";

// Halaman Home
function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil data saat halaman dibuka
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await api.get("/games");
        setGames(response.data.data); // Sesuai format JSON backend { data: [...] }
      } catch (error) {
        console.error("Gagal mengambil game:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Mau Top Up Apa Hari Ini?
        </h1>
        <p className="text-gray-500 mb-8">
          Pilih game favoritmu dan top up instan.
        </p>

        {loading ? (
          // Skeleton Loading (Efek loading sederhana)
          <div className="text-center py-20 text-gray-400">
            Sedang memuat game...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Routing Utama
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Nanti kita tambah Route Detail di sini */}
        <Route path="/game/:slug" element={<GameDetail />} />
        <Route
          path="/game/:slug"
          element={<div className="p-10">Halaman Detail (Belum dibuat)</div>}
        />
      </Routes>
    </Router>
  );
}

export default App;
