import React, { memo, useRef } from "react";
import { Media } from "../types";
import { MovieCard } from "./MovieCard";

interface MovieRowProps {
  title: string;
  movies: Media[];
  onMovieClick: (movie: Media) => void;
  onDownload: (movie: Media) => void;
  onToggleFavorite: (movie: Media) => void;
  favorites: Set<string>;
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingProgress: Record<string, any>;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
}

export const MovieRow = memo(({
  title,
  movies,
  onMovieClick,
  onDownload,
  onToggleFavorite,
  favorites,
  downloadedIds,
  downloadingIds,
  downloadingProgress,
  onPause,
  onResume,
}: MovieRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3 py-4">
      <h3 className="text-lg font-bold text-white px-4 tracking-tight">{title}</h3>
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar px-4"
      >
        {movies.map((movie) => (
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
            onPause={onPause}
            onResume={onResume}
          />
        ))}
      </div>
    </div>
  );
});
