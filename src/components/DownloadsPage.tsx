import React, { useState, useEffect } from "react";
import { Media } from "../types";
import { MovieCard } from "./MovieCard";
import { storageService, StoredVideo } from "../services/storageService";

export const DownloadsPage = ({ 
  downloadedIds,
  downloadingIds,
  downloadingProgress,
  onMovieClick,
  onDownload,
  onToggleFavorite,
  favorites
}: {
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingProgress: Record<string, number>;
  onMovieClick: (movie: Media) => void;
  onDownload: (movie: Media) => void;
  onToggleFavorite: (movie: Media) => void;
  favorites: Set<string>;
}) => {
  const [downloadedMovies, setDownloadedMovies] = useState<Media[]>([]);

  useEffect(() => {
    const fetchOfflineMetadata = async () => {
      const ids = await storageService.getAllDownloadedIds();
      const movies: Media[] = [];
      for (const id of ids) {
        const video = await storageService.getVideo(id);
        if (video) {
          movies.push(video.metadata);
        }
      }
      setDownloadedMovies(movies);
    };
    fetchOfflineMetadata();
  }, [downloadedIds]);

  return (
    <div className="pt-28 md:pt-32 px-6 md:px-16 space-y-10 min-h-[70vh] pb-32">
      <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Downloads</h2>
      {downloadedMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {downloadedMovies.map(movie => (
            <MovieCard 
              key={movie.id}
              movie={movie} 
              onClick={onMovieClick}
              onDownload={onDownload}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.has(movie.id)}
              isDownloaded={true}
              isDownloading={false}
              progress={100}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-500 text-lg">
          No downloads yet.
        </div>
      )}
    </div>
  );
};
