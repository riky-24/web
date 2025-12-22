import React from "react";
import { Link } from "react-router-dom";
import { FaGamepad, FaStar } from "react-icons/fa";

const GameCard = ({ game }) => {
  return (
    <Link
      to={`/game/${game.slug}`}
      className="group relative block w-full h-full"
    >
      {/* Background Glow Effect saat Hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500 group-hover:duration-200"></div>

      <div className="relative flex flex-col h-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl transition-transform duration-300 group-hover:-translate-y-2">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={game.image}
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>

          {/* Category Badge */}
          <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
            {game.category || "GAME"}
          </div>

          {/* Publisher (Bottom) */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              <FaStar /> 4.9/5
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {game.publisher}
            </p>
          </div>
        </div>

        {/* Info Content */}
        <div className="p-4 bg-slate-800 flex-grow flex flex-col justify-between border-t border-slate-700">
          <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
            {game.name}
          </h3>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <FaGamepad /> Instant
            </div>
            <span className="group-hover:text-white transition-colors">
              Top Up &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
