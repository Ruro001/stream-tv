import { motion } from "motion/react";
import { Star, Check, ArrowDownToLine, Heart } from "lucide-react";
import { Media } from "../types";

export const MovieCard = ({ 
  movie, 
  onClick, 
  onDownload,
  onToggleFavorite,
  isFavorite,
  isDownloaded,
  isDownloading,
  progress,
  received,
  total
}: { 
  movie: Media; 
  onClick: (movie: Media) => void; 
  onDownload: (movie: Media) => void; 
  onToggleFavorite: (movie: Media) => void;
  isFavorite: boolean;
  isDownloaded: boolean;
  isDownloading: boolean;
  progress: number;
  received?: number;
  total?: number;
  key?: string | number;
}) => {
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col gap-1.5">
          {isDownloading && total && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[8px] text-white font-bold drop-shadow-md">
                <span>{formatBytes(received)} / {formatBytes(total)}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-prime-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <h3 className="text-white text-xs md:text-sm font-bold truncate drop-shadow-md">
            {movie.title}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};
