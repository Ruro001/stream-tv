import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Heart, Play, Star, Plus, ArrowDownToLine, Check } from "lucide-react";
import { Media, Episode } from "../types";
import { tmdbService } from "../services/tmdbService";

interface SeriesDetailsProps {
  series: Media;
  onClose: () => void;
  onPlay: (media: Media, episode?: Episode) => void;
  onDownload: (episode: Episode) => void;
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingProgress: Record<string, any>;
}

export const SeriesDetails = ({
  series,
  onClose,
  onPlay,
  onDownload,
  downloadedIds,
  downloadingIds,
  downloadingProgress,
}: SeriesDetailsProps) => {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEpisodes = async () => {
      setIsLoading(true);
      const eps = await tmdbService.getEpisodes(series.id, selectedSeason);
      setEpisodes(eps);
      setIsLoading(false);
    };
    fetchEpisodes();
  }, [series.id, selectedSeason]);

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
        layoutId={`poster-${series.id}`}
        className="relative w-full h-[55vh]"
      >
        <img
          src={series.backdrop || series.thumbnail}
          alt={series.title}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f232b] via-transparent to-black/30" />

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => onPlay(series, episodes[0])}
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
            {series.title}{" "}
            <span className="text-gray-400 font-normal">({series.year})</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {series.seasons || 1} Seasons
          </p>
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
              {series.rating ? series.rating.toFixed(1) : "7.9"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 px-4">
          <button className="flex flex-col items-center gap-2 text-white hover:text-gray-300 transition-colors">
            <Plus className="w-6 h-6" />
            <span className="text-[11px] font-medium">Add to list</span>
          </button>
          <button className="flex flex-col items-center gap-2 text-white hover:text-gray-300 transition-colors">
            <ArrowDownToLine className="w-6 h-6" />
            <span className="text-[11px] font-medium">Download</span>
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
        <div className="mt-10 space-y-6">
          <div>
            <h3 className="text-white text-lg font-bold mb-2">Description</h3>
            <p className="text-gray-400 text-sm">{series.genre.join(", ")}</p>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-white text-lg font-bold">Overview</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {series.description}
            </p>
          </div>
        </div>

        {/* Episodes Section */}
        <div className="mt-10 pb-24">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-bold">Episodes</h3>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-md font-bold outline-none focus:border-white/50 transition-colors text-sm"
            >
              {Array.from(
                { length: series.seasons || 1 },
                (_, i) => i + 1
              ).map((season) => (
                <option
                  key={season}
                  value={season}
                  className="bg-[#1f232b] text-white"
                >
                  Season {season}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-prime-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {episodes.map((episode, index) => (
                <div
                  key={episode.id}
                  className="flex flex-col md:flex-row gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/10"
                >
                  <div
                    className="flex items-center gap-4 md:w-1/4 shrink-0 cursor-pointer"
                    onClick={() => onPlay(series, episode)}
                  >
                    <span className="text-gray-400 font-bold text-lg md:text-2xl w-8 text-center group-hover:text-white transition-colors">
                      {index + 1}
                    </span>
                    <div className="relative aspect-video w-full md:w-40 rounded-lg overflow-hidden bg-white/5">
                      {episode.thumbnail ? (
                        <img
                          src={episode.thumbnail}
                          alt={episode.title}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4
                        className="text-white font-bold text-sm md:text-base group-hover:text-prime-blue transition-colors line-clamp-1 cursor-pointer"
                        onClick={() => onPlay(series, episode)}
                      >
                        {episode.title}
                      </h4>
                      <button
                        onClick={() => onDownload(episode)}
                        disabled={downloadingIds.has(episode.id)}
                        className={`transition-colors ${
                          downloadedIds.has(episode.id)
                            ? "text-green-500"
                            : "text-white hover:text-gray-300"
                        }`}
                      >
                        {downloadingIds.has(episode.id) ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : downloadedIds.has(episode.id) ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <ArrowDownToLine className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                    <p
                      className="text-gray-400 text-xs md:text-sm line-clamp-2 leading-relaxed cursor-pointer"
                      onClick={() => onPlay(series, episode)}
                    >
                      {episode.description || "No description available."}
                    </p>
                  </div>
                </div>
              ))}
              {episodes.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No episodes found for this season.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
