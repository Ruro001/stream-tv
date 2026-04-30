import React, { memo } from "react";
import { motion } from "motion/react";
import { Star, Check, ArrowDownToLine, Heart, Pause, Play } from "lucide-react";
import { Media } from "../types";

export const MovieCard = memo(({ 
  movie, 
  onClick, 
  onDownload,
  onToggleFavorite,
  isFavorite,
  isDownloaded,
  isDownloading,
  progressDetails,
  onPause,
  onResume
}: { 
  movie: Media; 
  onClick: (movie: Media) => void; 
  onDownload: (movie: Media) => void;
  onToggleFavorite: (movie: Media) => void;
  isFavorite: boolean;
  isDownloaded: boolean;
  isDownloading: boolean;
  progressDetails?: {
    progress: number;
    receivedBytes: number;
    totalBytes: number;
    speed: number;
    status: string;
  };
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  key?: string | number;
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isPaused = progressDetails?.status === 'paused';

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(movie)}
      className="flex-none w-[120px] md:w-[180px] cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-white/5">
        <img 
          src={movie.thumbnail} 
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/movie/500/750'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Progress Overlay */}
        {isDownloading && progressDetails && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-3 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center mb-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  isPaused ? onResume?.(movie.id) : onPause?.(movie.id);
                }}
                className="hover:scale-110 transition-transform"
              >
                {isPaused ? (
                  <Play className="w-6 h-6 text-white fill-white" />
                ) : (
                  <Pause className="w-6 h-6 text-white fill-white" />
                )}
              </button>
            </div>
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-[#E53935] h-full transition-all duration-300"
                style={{ width: `${progressDetails.progress}%` }}
              />
            </div>
            <p className="text-white text-[10px] font-bold">
              {formatBytes(progressDetails.receivedBytes)} / {formatBytes(progressDetails.totalBytes)}
            </p>
            {progressDetails.speed > 0 && !isPaused && (
              <p className="text-gray-400 text-[8px] mt-1 italic">
                {formatBytes(progressDetails.speed)}/s
              </p>
            )}
            {isPaused && (
              <p className="text-yellow-500 text-[8px] mt-1 font-bold">PAUSED</p>
            )}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Top Left Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {movie.isTrending && (
            <div className="bg-[#E53935] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg w-fit tracking-wider">
              TOP 10
            </div>
          )}
          {movie.rating > 0 && (
            <div className="bg-black/40 backdrop-blur-md rounded-md px-1.5 py-0.5 flex items-center gap-1 w-fit">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-[10px] font-bold">
                {movie.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Favorite Icon */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie); }}
          className="absolute top-2 right-10 p-1.5 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors z-10"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "text-red-500 fill-red-500" : "text-white"}`} />
        </button>

        {/* Download Icon */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDownload(movie); }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors z-10"
        >
          {isDownloading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isDownloaded ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDownToLine className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="text-white text-xs md:text-sm font-bold truncate drop-shadow-md">
            {movie.title}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.movie.id === nextProps.movie.id &&
         prevProps.isFavorite === nextProps.isFavorite &&
         prevProps.isDownloaded === nextProps.isDownloaded &&
         prevProps.isDownloading === nextProps.isDownloading &&
         prevProps.progressDetails === nextProps.progressDetails;
});
