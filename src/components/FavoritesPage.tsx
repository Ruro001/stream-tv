import React from "react";
import { Media } from "../types";
import { MovieCard } from "./MovieCard";

export const FavoritesPage = ({ 
  favorites,
  movieLists,
  onMovieClick,
  onDownload,
  onToggleFavorite,
  downloadedIds,
  downloadingIds,
  downloadingProgress
}: {
  favorites: Set<string>;
  movieLists: Media[][];
  onMovieClick: (movie: Media) => void;
  onDownload: (movie: Media) => void;
  onToggleFavorite: (movie: Media) => void;
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingProgress: Record<string, number>;
}) => {
  const allMovies = Array.from(new Map(movieLists.flat().map(m => [m.id, m])).values());
  const favoriteMovies = allMovies.filter(movie => favorites.has(movie.id));

  return (
    <div className="pt-28 md:pt-32 px-6 md:px-16 space-y-10 md:space-y-12 min-h-[70vh] pb-32">
      <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Your Favorites</h2>
      {favoriteMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {favoriteMovies.map(movie => (
            <MovieCard 
              key={movie.id}
              movie={movie}
              onClick={onMovieClick}
              onDownload={onDownload}
              onToggleFavorite={onToggleFavorite}
              isFavorite={true}
              isDownloaded={downloadedIds.has(movie.id)}
              isDownloading={downloadingIds.has(movie.id)}
              progress={downloadingProgress[movie.id] || 0}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-4xl">❤️</span>
          </div>
          <h3 className="text-xl font-bold text-white">No favorites yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto">Start favoriting movies and shows to see them here.</p>
        </div>
      )}
    </div>
  );
};
