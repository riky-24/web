import React from "react";
import { Link } from "react-router-dom";

const GameCard = ({ game }) => {
  return (
    <Link to={`/game/${game.slug}`} className="group">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-400">
        {/* Gambar Game */}
        <div className="aspect-[4/3] overflow-hidden relative">
          <img
            src={game.image}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {/* Badge Kategori */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {game.category}
          </div>
        </div>

        {/* Info Game */}
        <div className="p-4">
          <h3 className="font-bold text-gray-800 truncate group-hover:text-blue-600">
            {game.name}
          </h3>
          <p className="text-sm text-gray-500">{game.publisher}</p>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
