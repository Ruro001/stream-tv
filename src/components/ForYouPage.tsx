import React from "react";
import { Media } from "../types";
import { MovieCard } from "./MovieCard";

export const ForYouPage = ({ 
  recommendations,
  onMovieClick,
  onDownload,
  onToggleFavorite,
  favorites,
  downloadedIds,
  downloadingIds,
  downloadingProgress
}: {
  recommendations: Media[];
  onMovieClick: (movie: Media) => void;
  onDownload: (movie: Media) => void;
  onToggleFavorite: (movie: Media) => void;
  favorites: Set<string>;
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingProgress: Record<string, any>;
}) => {
  return (
    <div className="pt-28 md:pt-32 px-6 md:px-16 space-y-10 min-h-[70vh] pb-32">
      <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">For You</h2>
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {recommendations.map(movie => (
            <MovieCard 
              key={movie.id}
              movie={movie} 
              onClick={onMovieClick}
              onDownload={onDownload}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.has(movie.id)}
              isDownloaded={downloadedIds.has(movie.id)}
              isDownloading={downloadingIds.has(movie.id)}
              progressDetails={downloadingProgress[movie.id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-500 text-lg">
          Watch more movies to get personalized recommendations!
        </div>
      )}
    </div>
  );
};
