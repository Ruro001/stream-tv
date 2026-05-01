import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, Heart, Play, Star, Plus, ArrowDownToLine, Check } from "lucide-react";
import { Media } from "../types";

interface MovieDetailsProps {
  movie: Media;
  onClose: () => void;
  onDownload: (movie: Media) => void;
  isDownloaded: boolean;
  isDownloading: boolean;
  onPlay: (movie: Media) => void;
}

export const MovieDetails = ({
  movie,
  onClose,
  onDownload,
  isDownloaded,
  isDownloading,
  onPlay,
}: MovieDetailsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#1f232b] overflow-y-auto no-scrollbar"
    >
      {/* Top Bar */}
      <div className="absolute top-0 w-full z-20 flex justify-between items-center p-6 pt-12">
        <button onClick={onClose} className="p-2">
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
        <button className="p-2">
          <Heart className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Hero Image */}
      <motion.div
        layoutId={`poster-${movie.id}`}
        className="relative w-full h-[55vh]"
      >
        <img
          src={movie.backdrop || movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f232b] via-transparent to-black/30" />

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => onPlay(movie)}
            className="w-16 h-16 rounded-full border-2 border-white/50 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative px-6 -mt-12">
        {/* FAB */}
        <div className="absolute right-6 -top-6 z-10">
          <button className="bg-[#E53935] rounded-[32px] px-4 py-4 flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(229,57,53,0.4)] hover:scale-105 transition-transform min-w-[70px]">
            <Star className="w-5 h-5 text-white fill-white mb-1" />
            <span className="text-white text-[10px] font-bold">(1.2k)</span>
            <span className="text-white text-[9px] font-medium">Reviews</span>
          </button>
        </div>

        <div className="pr-24">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {movie.title}{" "}
            <span className="text-gray-400 font-normal">({movie.year})</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">{movie.genre.join(", ")}</p>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-3 mt-4">
          <span className="border border-gray-500 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">
            16+
          </span>
          <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs font-bold">
            HD
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-bold">
              {movie.rating ? movie.rating.toFixed(1) : "7.9"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 px-4">
          <button className="flex flex-col items-center gap-2 text-white hover:text-gray-300 transition-colors">
            <Plus className="w-6 h-6" />
            <span className="text-[11px] font-medium">Add to list</span>
          </button>
          <button
            onClick={() => onDownload(movie)}
            disabled={isDownloading}
            className={`flex flex-col items-center gap-2 transition-colors ${
              isDownloaded ? "text-green-500" : "text-white hover:text-gray-300"
            }`}
          >
            {isDownloading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isDownloaded ? (
              <Check className="w-6 h-6" />
            ) : (
              <ArrowDownToLine className="w-6 h-6" />
            )}
            <span className="text-[11px] font-medium">
              {isDownloaded ? "Downloaded" : "Download"}
            </span>
          </button>
          <button className="flex flex-col items-center gap-2 text-white hover:text-gray-300 transition-colors">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span className="text-[11px] font-medium">Share</span>
          </button>
        </div>

        {/* Description & Overview */}
        <div className="mt-10 space-y-6 pb-24">
          <div>
            <h3 className="text-white text-lg font-bold mb-2">Description</h3>
            <p className="text-gray-400 text-sm">
              {movie.genre.join(", ")} {movie.duration ? `â€¢ ${movie.duration}` : ""}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-white text-lg font-bold">Overview</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {movie.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
