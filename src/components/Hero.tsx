import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { Media } from "../types";
import { hapticsService } from "../services/hapticsService";

interface HeroProps {
  movies: Media[];
  onInfoClick: (movie: Media) => void;
  onPlay: (movie: Media) => void;
}

export const Hero = ({ movies, onInfoClick, onPlay }: HeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [movies.length]);

  const movie = movies[currentIndex] || movies[0];
  if (!movie) return null;

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] flex flex-col justify-end pb-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src={movie.backdrop || movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f232b] via-[#1f232b]/50 to-transparent" />
      </div>

      <motion.div
        key={movie.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 w-full max-w-4xl mx-auto"
      >
        <div className="flex items-end justify-between w-full">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-xs md:text-sm font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded backdrop-blur-md">
                Available Now
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Watch {movie.title}
            </h2>
            <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">
              {movie.genre[0] || "Drama"}
            </p>
          </div>

          <button
            onClick={() => {
              hapticsService.impactMedium();
              onPlay(movie);
            }}
            className="w-14 h-14 bg-[#E53935] rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(229,57,53,0.4)] hover:scale-105 transition-transform"
          >
            <Play className="fill-white w-6 h-6 ml-1" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {movies.slice(0, 3).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIndex % 3 ? "w-6 bg-white" : "w-4 bg-white/30"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
