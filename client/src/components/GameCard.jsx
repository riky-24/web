import { Link } from "react-router-dom";
import { FaGamepad } from "react-icons/fa";

const GameCard = ({ game }) => {
  return (
    <Link to={`/game/${game.slug}`} className="group relative block h-full">
      {/* Container Kartu */}
      <div className="relative h-full bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 transition-all duration-300 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-2">
        {/* Gambar Thumbnail */}
        <div className="aspect-[4/5] w-full overflow-hidden">
          <img
            src={game.thumbnail}
            alt={game.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Overlay Gradient (Bawah ke Atas) */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
        </div>

        {/* Konten Text */}
        <div className="absolute bottom-0 left-0 w-full p-5">
          {/* Ikon Gamepad Kecil */}
          <div className="mb-2 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <div className="bg-blue-600 p-2 rounded-lg w-fit shadow-lg">
              <FaGamepad className="text-white text-xs" />
            </div>
          </div>

          <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight group-hover:text-blue-400 transition-colors">
            {game.name}
          </h3>
          <p className="text-slate-400 text-xs font-bold mt-1">
            {game.code || "GAME"}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
