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

  const handleExport = async (id: string, title: string) => {
    const video = await storageService.getVideo(id);
    if (!video) return;

    try {
      const url = URL.createObjectURL(video.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${video.quality}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export video file.");
    }
  };

  return (
    <div className="pt-28 md:pt-32 px-6 md:px-16 space-y-10 min-h-[70vh] pb-32">
      <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Downloads</h2>
      {downloadedMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-x-8 md:gap-y-12">
          {downloadedMovies.map(movie => (
            <div key={movie.id} className="flex flex-col gap-4 group">
              <MovieCard 
                movie={movie} 
                onClick={onMovieClick}
                onDownload={onDownload}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favorites.has(movie.id)}
                isDownloaded={true}
                isDownloading={false}
                progress={100}
              />
              <button 
                onClick={() => handleExport(movie.id, movie.title)}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all opacity-0 group-hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save to Device
              </button>
            </div>
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
