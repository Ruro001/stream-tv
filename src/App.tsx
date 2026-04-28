/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Info, 
  Plus, 
  Search, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  X,
  Star,
  Volume2,
  VolumeX,
  Download,
  Check,
  ArrowDownToLine,
  Trash2,
  Sparkles,
  Heart
} from "lucide-react";
import { Media, WatchProvider, UserProfile, MediaType, Episode } from "./types";
import { tmdbService } from "./services/tmdbService";
import { MOCK_MOVIES } from "./constants";
import { supabase } from "./lib/supabase";
import { VideoPlayer } from "./components/VideoPlayer";
import { ProfileSelection } from "./components/ProfileSelection";
import { MovieCard } from "./components/MovieCard";
import { FavoritesPage } from "./components/FavoritesPage";
import { DownloadsPage } from "./components/DownloadsPage";
import { ForYouPage } from "./components/ForYouPage";
import { ProfilePage } from "./components/ProfilePage";

import { LoginScreen } from "./components/AuthScreens";
import { storageService } from "./services/storageService";
import { movieboxService, MovieBoxSource } from "./services/movieboxService";
import { DownloadTray } from "./components/DownloadTray";
import { downloadManager } from "./services/downloadManager";

const DEFAULT_PROFILES: UserProfile[] = [
  { id: "1", name: "Favour", avatar: "F", color: "bg-prime-blue" },
  { id: "2", name: "Kids", avatar: "K", color: "bg-green-500" },
  { id: "3", name: "Guest", avatar: "G", color: "bg-netflix-red" },
];

const Navbar = ({ 
  onSearch, 
  activeMediaType, 
  onMediaTypeChange,
  activeProfile,
  onProfileClick,
  genres,
  activeGenre,
  onGenreChange
}: { 
  onSearch: (query: string) => void; 
  activeMediaType: MediaType;
  onMediaTypeChange: (type: MediaType) => void;
  activeProfile: UserProfile | null;
  onProfileClick: () => void;
  genres: { id: number; name: string }[];
  activeGenre: { id: number; name: string } | null;
  onGenreChange: (genre: { id: number; name: string } | null) => void;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 px-4 md:px-12 py-3 flex items-center justify-between ${isScrolled ? "bg-[#1f232b]/95 backdrop-blur-md shadow-lg border-b border-white/5" : "bg-gradient-to-b from-black/90 via-black/40 to-transparent"}`}>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* LOGO */}
        <div className="flex items-center cursor-pointer py-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img 
            src="/logo.png" 
            alt="RURO TV" 
            className="h-7 md:h-11 w-auto object-contain" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x80/black/red?text=RURO+TV'; }}
          />
        </div>
        
        <div className="relative flex items-center">
          <AnimatePresence>
            {isSearchVisible && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 140, opacity: 1 }}
                whileFocus={{ width: 220 }}
                exit={{ width: 0, opacity: 0 }}
                className="absolute left-8 flex items-center"
              >
                <input 
                  autoFocus
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onSearch(e.target.value);
                  }}
                  placeholder="Search..."
                  className="bg-white/10 border border-white/20 rounded-full pl-3 pr-8 py-1.5 text-xs md:text-sm w-full outline-none text-white focus:bg-white/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); onSearch(""); }}
                    className="absolute right-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <Search 
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            className="w-5 h-5 md:w-6 md:h-6 text-white cursor-pointer hover:text-[#E53935] transition-colors" 
          />
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
        <button 
          onClick={() => onMediaTypeChange("movie")}
          className={`text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${activeMediaType === "movie" ? "text-[#E53935] border-b-2 border-[#E53935] pb-1" : "text-gray-300 hover:text-white"}`}
        >
          Movies
        </button>
        <button 
          onClick={() => onMediaTypeChange("tv")}
          className={`text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${activeMediaType === "tv" ? "text-[#E53935] border-b-2 border-[#E53935] pb-1" : "text-gray-300 hover:text-white"}`}
        >
          TV Shows
        </button>
        <button className="text-sm font-bold text-gray-300 hover:text-white transition-all whitespace-nowrap uppercase tracking-wider">
          Trailers
        </button>
      </div>

      {/* Mobile/Right Actions */}
      <div className="flex items-center gap-3">
        {activeProfile && (
          <div 
            onClick={onProfileClick}
            className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-white text-sm font-black cursor-pointer ring-2 ring-transparent hover:ring-white/40 transition-all shadow-lg ${activeProfile.color || 'bg-prime-blue'}`}
          >
            {activeProfile.avatar}
          </div>
        )}
      </div>
    </nav>
  );
};

const Hero = ({ movies, onInfoClick, onPlay }: { 
  movies: Media[]; 
  onInfoClick: (movie: Media) => void;
  onPlay: (movie: Media) => void;
}) => {
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
              <span className="text-white text-xs md:text-sm font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded backdrop-blur-md">Available Now</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Watch {movie.title}
            </h2>
            <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">
              {movie.genre[0] || "Drama"}
            </p>
          </div>
          
          <button 
            onClick={() => onPlay(movie)}
            className="w-14 h-14 bg-[#E53935] rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(229,57,53,0.4)] hover:scale-105 transition-transform"
          >
            <Play className="fill-white w-6 h-6 ml-1" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {movies.slice(0, 3).map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex % 3 ? "w-6 bg-white" : "w-4 bg-white/30"}`} 
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};


const MovieRow = ({ 
  title, 
  movies, 
  onMovieClick, 
  onDownload,
  onToggleFavorite,
  favorites,
  downloadedIds,
  downloadingIds,
  downloadingProgress
}: { 
  title: string; 
  movies: Media[]; 
  onMovieClick: (movie: Media) => void; 
  onDownload: (movie: Media) => void;
  onToggleFavorite: (movie: Media) => void;
  favorites: Set<string>;
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingProgress: Record<string, number>;
}) => {
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
            progress={downloadingProgress[movie.id] || 0}
          />
        ))}
      </div>
    </div>
  );
};

const BottomNav = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: "home", label: "Home", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    )},
    { id: "for-you", label: "For You", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    )},
    { id: "favorites", label: "Favorites", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    )},
    { id: "downloads", label: "Downloads", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
      </svg>
    )},
    { id: "profile", label: "Profile", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    )}
  ];

  return (
    <div className="fixed bottom-0 w-full bg-[#2b313d] h-[72px] flex items-center justify-between z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] px-2">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button 
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center justify-center transition-all duration-300 h-12 relative ${
              isActive 
                ? `bg-[#E53935] text-white ${
                    index === 0 ? 'rounded-r-full rounded-l-none pl-6 pr-6 -ml-2' : 
                    index === tabs.length - 1 ? 'rounded-l-full rounded-r-none pr-6 pl-6 -mr-2' : 
                    'rounded-full px-6'
                  }` 
                : `text-[#8E98A8] hover:text-white px-4`
            }`}
          >
            {isActive ? (
              <span className="font-medium text-[15px]">{tab.label}</span>
            ) : (
              tab.icon
            )}
          </button>
        );
      })}
    </div>
  );
};

const SeriesDetails = ({ 
  series, 
  onClose, 
  onPlay,
  onDownload,
  downloadedIds,
  downloadingIds,
  downloadingProgress
}: { 
  series: Media; 
  onClose: () => void;
  onPlay: (media: Media, episode?: Episode) => void;
  onDownload: (episode: Episode) => void;
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingProgress: Record<string, number>;
}) => {
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
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
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
      <div className="relative w-full h-[55vh]">
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
      </div>

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
            {series.title} <span className="text-gray-400 font-normal">({series.year})</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">{series.seasons || 1} Seasons</p>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-3 mt-4">
          <span className="border border-gray-500 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">16+</span>
          <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs font-bold">HD</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-bold">{series.rating ? series.rating.toFixed(1) : "7.9"}</span>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
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
            <p className="text-gray-400 text-sm">
              {series.genre.join(", ")}
            </p>
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
              {Array.from({ length: series.seasons || 1 }, (_, i) => i + 1).map(season => (
                <option key={season} value={season} className="bg-[#1f232b] text-white">
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
                  <div className="flex items-center gap-4 md:w-1/4 shrink-0 cursor-pointer" onClick={() => onPlay(series, episode)}>
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
                      <h4 className="text-white font-bold text-sm md:text-base group-hover:text-prime-blue transition-colors line-clamp-1 cursor-pointer" onClick={() => onPlay(series, episode)}>
                        {episode.title}
                      </h4>
                      <button 
                        onClick={() => onDownload(episode)}
                        disabled={downloadingIds.has(episode.id)}
                        className={`transition-colors ${downloadedIds.has(episode.id) ? "text-green-500" : "text-white hover:text-gray-300"}`}
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
                    <p className="text-gray-400 text-xs md:text-sm line-clamp-2 leading-relaxed cursor-pointer" onClick={() => onPlay(series, episode)}>
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

const MovieDetails = ({ 
  movie, 
  onClose, 
  onDownload, 
  isDownloaded, 
  isDownloading,
  onPlay
}: { 
  movie: Media; 
  onClose: () => void;
  onDownload: (movie: Media) => void;
  isDownloaded: boolean;
  isDownloading: boolean;
  onPlay: (movie: Media) => void;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
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
      <div className="relative w-full h-[55vh]">
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
      </div>

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
            {movie.title} <span className="text-gray-400 font-normal">({movie.year})</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">The Devil Made Me Do It</p>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-3 mt-4">
          <span className="border border-gray-500 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">16+</span>
          <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs font-bold">HD</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-bold">{movie.rating ? movie.rating.toFixed(1) : "7.9"}</span>
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
            className={`flex flex-col items-center gap-2 transition-colors ${isDownloaded ? "text-green-500" : "text-white hover:text-gray-300"}`}
          >
            {isDownloading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isDownloaded ? (
              <Check className="w-6 h-6" />
            ) : (
              <ArrowDownToLine className="w-6 h-6" />
            )}
            <span className="text-[11px] font-medium">{isDownloaded ? "Downloaded" : "Download"}</span>
          </button>
          <button className="flex flex-col items-center gap-2 text-white hover:text-gray-300 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
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
              {movie.genre.join(", ")} • {movie.duration || "1h 51m"}
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-white text-lg font-bold">Overview</h3>
              <span className="text-gray-400 text-xs font-medium">Mon, 25 Jan 2021</span>
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

export default function App() {
  const [appState, setAppState] = useState<'loading' | 'login' | 'main'>('loading');
  const [selectedMovie, setSelectedMovie] = useState<Media | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Media | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [activeMediaType, setActiveMediaType] = useState<MediaType>("movie");
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("profiles");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
  });
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("activeProfile");
    return saved ? JSON.parse(saved) : null;
  });
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("downloadedIds");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadingProgress, setDownloadingProgress] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});

  // Quality Selection State
  const [downloadingMovie, setDownloadingMovie] = useState<Media | null>(null);
  const [availableDownloadQualities, setAvailableDownloadQualities] = useState<MovieBoxSource[]>([]);
  const [isFetchingQualities, setIsFetchingQualities] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setActiveTab("downloads"); // Auto-switch to downloads when internet is lost
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Sync true downloaded IDs from Storage
    const syncDownloads = async () => {
      const ids = await storageService.getAllDownloadedIds();
      setDownloadedIds(new Set(ids));
    };
    syncDownloads();
  }, []);

  useEffect(() => {
    if (activeProfile && supabase) {
      const fetchUserData = async () => {
        const { data: progressData } = await supabase
          .from('user_media_progress')
          .select('media_id, timestamp')
          .eq('user_id', activeProfile.id);
        
        if (progressData) {
          const progressMap: Record<string, number> = {};
          progressData.forEach(item => {
            progressMap[item.media_id] = item.timestamp;
          });
          setUserProgress(progressMap);
        }

        const { data: favoritesData } = await supabase
          .from('user_media_favorites')
          .select('media_id')
          .eq('user_id', activeProfile.id);
        
        if (favoritesData) {
          setUserFavorites(new Set(favoritesData.map(item => item.media_id)));
        }
      };
      fetchUserData();
    }
  }, [activeProfile]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(Array.from(favorites)));
  }, [favorites]);


  const [recentlyWatched, setRecentlyWatched] = useState<Media[]>([]);
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  
  const [trendingMovies, setTrendingMovies] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Media[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Media[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Media[]>([]);
  const [recentlyAddedMovies, setRecentlyAddedMovies] = useState<Media[]>([]);
  const [recentlyAddedTVShows, setRecentlyAddedTVShows] = useState<Media[]>([]);
  const [actionMovies, setActionMovies] = useState<Media[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Media[]>([]);
  const [scifiMovies, setScifiMovies] = useState<Media[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Media[]>([]);
  const [animationMovies, setAnimationMovies] = useState<Media[]>([]);

  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [activeGenre, setActiveGenre] = useState<{ id: number; name: string } | null>(null);
  const [genreMovies, setGenreMovies] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAppState('main');
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAppState(session ? 'main' : 'login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAppState(session ? 'main' : 'login');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profiles from Supabase when logged in
  useEffect(() => {
    if (appState === 'main' && supabase) {
      const loadProfiles = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dbProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching profiles:", error);
          return;
        }

        if (dbProfiles && dbProfiles.length > 0) {
          // Map DB profiles to UserProfile interface
          const mapped: UserProfile[] = dbProfiles.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar || (p.name ? p.name[0].toUpperCase() : 'U'),
            color: p.color || 'bg-prime-blue'
          }));
          setProfiles(mapped);
        } else {
          // No profiles found, create a default one
          const newProfile: UserProfile = {
            id: crypto.randomUUID(), // Temporarily, it will be replaced by DB ID
            name: user.email?.split('@')[0] || "User",
            avatar: user.email?.[0].toUpperCase() || "U",
            color: "bg-prime-blue"
          };

          const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              name: newProfile.name,
              avatar: newProfile.avatar,
              color: newProfile.color
            })
            .select()
            .single();

          if (created && !createError) {
             setProfiles([{
               id: created.id,
               name: created.name,
               avatar: created.avatar,
               color: created.color
             }]);
          }
        }
      };
      loadProfiles();
    }
  }, [appState]);

  useEffect(() => {
    localStorage.setItem("profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (activeProfile) {
      localStorage.setItem("activeProfile", JSON.stringify(activeProfile));
    } else {
      localStorage.removeItem("activeProfile");
    }
  }, [activeProfile]);

  useEffect(() => {
    localStorage.setItem("downloadedIds", JSON.stringify(Array.from(downloadedIds)));
  }, [downloadedIds]);

  useEffect(() => {
    const saved = localStorage.getItem("recentlyWatched");
    if (saved) {
      try {
        setRecentlyWatched(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recently watched", e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (activeTab === "for-you" && recentlyWatched.length > 0) {
        setIsLoading(true);
        try {
          // Get recommendations for the top 3 recently watched items to have a diverse list
          const topWatched = recentlyWatched.slice(0, 3);
          const recPromises = topWatched.map(m => tmdbService.getRecommendations(m.id, m.type));
          const results = await Promise.all(recPromises);
          
          // Flatten and unique by ID
          const allRecs: Media[] = results.flat();
          const uniqueRecs = Array.from(new Map<string, Media>(allRecs.map(m => [m.id, m])).values());
          
          // Filter out items already in recently watched
          const filteredRecs = uniqueRecs.filter(r => !recentlyWatched.some(w => w.id === r.id));
          
          setRecommendations(filteredRecs.slice(0, 20));
        } catch (error) {
          console.error("Failed to fetch recommendations", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchRecommendations();
  }, [activeTab, recentlyWatched]);

  useEffect(() => {
    const fetchGenres = async () => {
      let genreList = await tmdbService.getGenres(activeMediaType);
      
      // Ensure Sci-Fi is in the list
      const hasSciFi = genreList.some(g => g.name.toLowerCase().includes("sci-fi") || g.name.toLowerCase().includes("science fiction"));
      if (!hasSciFi) {
        genreList = [...genreList, { id: 878, name: "Sci-Fi" }];
      } else {
        // Rename "Science Fiction" to "Sci-Fi" for consistency if it exists
        genreList = genreList.map(g => 
          (g.name === "Science Fiction" || g.name === "Sci-Fi & Fantasy") ? { ...g, name: "Sci-Fi" } : g
        );
      }

      setGenres(genreList);
      setActiveGenre(null); // Reset genre when media type changes
    };
    fetchGenres();
  }, [activeMediaType]);

  useEffect(() => {
    const fetchGenreMovies = async () => {
      if (activeGenre) {
        setIsLoading(true);
        const movies = await tmdbService.getMediaByGenre(activeMediaType, activeGenre.id);
        setGenreMovies(movies);
        setIsLoading(false);
      }
    };
    fetchGenreMovies();
  }, [activeGenre, activeMediaType]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!import.meta.env.VITE_TMDB_API_KEY) {
        setIsApiKeyMissing(true);
        // Fallback to mock data if API key is missing
        setTrendingMovies(MOCK_MOVIES.filter(m => m.isTrending));
        setPopularMovies(MOCK_MOVIES);
        setTopRatedMovies([...MOCK_MOVIES].reverse());
        
        // Pack mock database rows differently
        setActionMovies([...MOCK_MOVIES].sort(() => 0.5 - Math.random()));
        setComedyMovies([...MOCK_MOVIES].sort(() => 0.5 - Math.random()));
        setScifiMovies([...MOCK_MOVIES].sort(() => 0.5 - Math.random()));
        setHorrorMovies([...MOCK_MOVIES].sort(() => 0.5 - Math.random()));
        setAnimationMovies([...MOCK_MOVIES].sort(() => 0.5 - Math.random()));

        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const [trending, popular, topRated, nowPlaying, upcoming, action, comedy, scifi, horror, animation] = await Promise.all([
        tmdbService.getTrending(activeMediaType),
        tmdbService.getPopular(activeMediaType),
        tmdbService.getTopRated(activeMediaType),
        tmdbService.getNowPlaying(activeMediaType),
        tmdbService.getUpcoming(activeMediaType),
        tmdbService.getMediaByGenre(activeMediaType, 28), // Action
        tmdbService.getMediaByGenre(activeMediaType, 35), // Comedy
        tmdbService.getMediaByGenre(activeMediaType, activeMediaType === "movie" ? 878 : 10765), // Sci-Fi
        tmdbService.getMediaByGenre(activeMediaType, 27), // Horror
        tmdbService.getMediaByGenre(activeMediaType, 16), // Animation
      ]);
      
      setTrendingMovies(trending);
      setPopularMovies(popular);
      setTopRatedMovies(topRated);
      setNowPlayingMovies(nowPlaying);
      setUpcomingMovies(upcoming);
      
      setActionMovies(action);
      setComedyMovies(comedy);
      setScifiMovies(scifi);
      setHorrorMovies(horror);
      setAnimationMovies(animation);
      
      // Use nowPlaying for 'New Releases' to ensure actual data
      if (activeMediaType === "movie") {
        setRecentlyAddedMovies(nowPlaying);
        setRecentlyAddedTVShows([]);
      } else {
        setRecentlyAddedTVShows(nowPlaying);
        setRecentlyAddedMovies([]);
      }
      setIsLoading(false);
    };

    fetchInitialData();
  }, [activeMediaType]);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length > 2) {
        const results = await tmdbService.searchMedia(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMovieClick = async (movie: Media) => {
    setSelectedMovie(movie);
    // Fetch extra details like providers and trailer
    if (import.meta.env.VITE_TMDB_API_KEY) {
      const details = await tmdbService.getMediaDetails(movie.id, movie.type);
      setSelectedMovie(prev => prev ? { ...prev, ...details } : null);
    }
  };

  const featuredMovie = trendingMovies[0] || MOCK_MOVIES[0];
  const allMovies = Array.from(new Map([...trendingMovies, ...popularMovies, ...topRatedMovies, ...nowPlayingMovies, ...upcomingMovies, ...recentlyWatched, ...genreMovies].map(m => [m.id, m])).values());

  const addToRecentlyWatched = async (media: Media) => {
    setRecentlyWatched(prev => {
      const filtered = prev.filter(m => m.id !== media.id);
      const next = [media, ...filtered].slice(0, 10);
      localStorage.setItem("recentlyWatched", JSON.stringify(next));
      return next;
    });

    if (activeProfile && supabase) {
      await supabase
        .from('user_media_progress')
        .upsert({ 
          user_id: activeProfile.id, 
          media_id: media.id, 
          timestamp: 0 // Initial timestamp
        });
    }
  };

  const toggleFavorite = (movie: Media) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(movie.id)) {
        next.delete(movie.id);
      } else {
        next.add(movie.id);
      }
      localStorage.setItem("favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const downloadMovie = async (movie: Media) => {
    // If already downloaded, delete it
    if (downloadedIds.has(movie.id)) {
      if (confirm("Are you sure you want to delete this downloaded video?")) {
        await storageService.deleteVideo(movie.id);
        const nextIds = await storageService.getAllDownloadedIds();
        setDownloadedIds(new Set(nextIds));
      }
      return;
    }

    if (downloadingIds.has(movie.id)) return;

    // Show quality selector
    setDownloadingMovie(movie);
    setIsFetchingQualities(true);
    setDownloadError(null);
    
    try {
      const results = await movieboxService.search(movie.title);
      if (results.length > 0) {
        const sources = await movieboxService.getSources(results[0].subjectId, results[0].detailPath, movie.type === 'tv' ? 1 : undefined, movie.type === 'tv' ? 1 : undefined);
        setAvailableDownloadQualities(sources.sort((a, b) => b.quality - a.quality));
      } else {
        setDownloadError("Could not find sources for this movie.");
      }
    } catch (e) {
      setDownloadError("Failed to fetch quality options.");
    } finally {
      setIsFetchingQualities(false);
    }
  };

  const startRealDownload = async (source: MovieBoxSource) => {
    if (!downloadingMovie) return;
    
    const movie = downloadingMovie;
    const movieId = movie.id;
    
    setDownloadingIds(prev => new Set(prev).add(movieId));
    setDownloadingProgress(prev => ({ ...prev, [movieId]: 0 }));
    setDownloadingMovie(null);

    try {
      // Use the new DownloadManager with the correct proxy URL
      downloadManager.startDownload(movie, source.downloadUrl, `${source.quality}p`);
    } catch (error) {
      console.error("Download Error:", error);
      alert("Failed to start download.");
    }
  };

  // Sync DownloadManager updates with App state for MovieCard icons
  useEffect(() => {
    const unsubscribe = downloadManager.subscribe((state) => {
      if (state.status === 'completed') {
        setDownloadedIds(prev => new Set(prev).add(state.mediaId));
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(state.mediaId);
          return next;
        });
      } else if (state.status === 'downloading') {
        setDownloadingProgress(prev => ({ ...prev, [state.mediaId]: state.progress }));
        setDownloadingIds(prev => new Set(prev).add(state.mediaId));
      } else if (state.status === 'idle') {
         setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(state.mediaId);
          return next;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const downloadedMovies = allMovies.filter(m => downloadedIds.has(m.id));
  const currentlyDownloading = allMovies.filter(m => downloadingIds.has(m.id));
  const allDownloadItems = [...currentlyDownloading, ...downloadedMovies];

  const handleAddProfile = async (name: string) => {
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const color = ["bg-prime-blue", "bg-green-500", "bg-netflix-red", "bg-yellow-500", "bg-purple-500"][profiles.length % 5];
    const avatar = name[0].toUpperCase();

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        name,
        avatar,
        color
      })
      .select()
      .single();

    if (!error && data) {
      const newProfile: UserProfile = {
        id: data.id,
        name: data.name,
        avatar: data.avatar,
        color: data.color
      };
      setProfiles(prev => [...prev, newProfile]);
    } else {
      console.error("Error creating profile:", error);
    }
  };

  if (appState === 'loading') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (appState === 'login') {
    return <LoginScreen onLogin={() => setAppState('main')} />;
  }

  return (
    <div className="min-h-screen bg-dark-bg selection:bg-netflix-red selection:text-white">
      <AnimatePresence>
        {!activeProfile && (
          <ProfileSelection 
            profiles={profiles} 
            onSelect={setActiveProfile} 
            onAddProfile={handleAddProfile}
          />
        )}
      </AnimatePresence>

      <Navbar 
        onSearch={setSearchQuery} 
        activeMediaType={activeMediaType}
        onMediaTypeChange={setActiveMediaType}
        activeProfile={activeProfile}
        onProfileClick={() => setActiveProfile(null)}
        genres={genres}
        activeGenre={activeGenre}
        onGenreChange={setActiveGenre}
      />
      
      <main className="pb-32">
        {!isOnline && (
          <div className="pt-24 px-6 md:px-16 mb-8">
            <div className="bg-orange-500/20 border border-orange-500/40 p-4 rounded-2xl text-orange-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="font-bold text-sm">Offline Mode: Showing your downloads</span>
              </div>
            </div>
          </div>
        )}

        {isApiKeyMissing && isOnline && (
          <div className="pt-24 px-6 md:px-16">
            <div className="bg-prime-blue/20 border border-prime-blue/40 p-4 rounded-lg text-white flex items-center gap-4">
              <Info className="w-6 h-6 text-prime-blue" />
              <p className="text-sm md:text-base">
                <span className="font-bold">Real Data Mode:</span> Please add your <span className="font-mono bg-black/40 px-1 rounded">VITE_TMDB_API_KEY</span> to the environment variables to see real movies and free providers.
              </p>
            </div>
          </div>
        )}

        {searchQuery !== "" && isOnline ? (
          <div className="pt-28 md:pt-32 px-6 md:px-16 space-y-10 md:space-y-12">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Search Results for "{searchQuery}"</h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                {Array.from(new Map(searchResults.map((m: Media) => [m.id, m])).values()).map((movie: Media) => (
                  <MovieCard 
                    key={movie.id} 
                    movie={movie} 
                    onClick={handleMovieClick}
                    onDownload={downloadMovie}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={favorites.has(movie.id)}
                    isDownloaded={downloadedIds.has(movie.id)}
                    isDownloading={downloadingIds.has(movie.id)}
                    progress={downloadingProgress[movie.id] || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 md:py-32 text-gray-500 text-lg md:text-xl font-medium">
                No movies found matching your search.
              </div>
            )}
          </div>
        ) : !isOnline || activeTab === "downloads" ? (
          <DownloadsPage 
             downloadedIds={downloadedIds}
             downloadingIds={downloadingIds}
             downloadingProgress={downloadingProgress}
             onMovieClick={handleMovieClick}
             onDownload={downloadMovie}
             onToggleFavorite={toggleFavorite}
             favorites={favorites}
          />
        ) : activeTab === "favorites" ? (
          <FavoritesPage 
            favorites={favorites}
            movieLists={[
              trendingMovies,
              popularMovies,
              topRatedMovies,
              nowPlayingMovies,
              upcomingMovies,
              recentlyAddedMovies,
              recentlyAddedTVShows,
              genreMovies,
              recentlyWatched,
              searchResults
            ]}
            onMovieClick={handleMovieClick}
            onDownload={downloadMovie}
            onToggleFavorite={toggleFavorite}
            downloadedIds={downloadedIds}
            downloadingIds={downloadingIds}
            downloadingProgress={downloadingProgress}
          />
        ) : activeTab === "downloads" ? (
          <DownloadsPage 
            downloadedIds={downloadedIds}
            downloadingIds={downloadingIds}
            downloadingProgress={downloadingProgress}
            onMovieClick={handleMovieClick}
            onDownload={downloadMovie}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        ) : activeTab === "profile" ? (
          <ProfilePage onLogout={async () => {
            await supabase?.auth.signOut();
            setAppState('login');
          }} />
        ) : activeTab === "for-you" ? (
          <ForYouPage 
            recommendations={allMovies.filter(m => userFavorites.has(m.id) || recentlyWatched.some(w => w.id === m.id))}
            onMovieClick={handleMovieClick}
            onDownload={downloadMovie}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            downloadedIds={downloadedIds}
            downloadingIds={downloadingIds}
            downloadingProgress={downloadingProgress}
          />
        ) : (
          <>
            {!activeGenre && (
              <Hero 
                movies={trendingMovies.length > 0 ? trendingMovies : MOCK_MOVIES}
                onInfoClick={handleMovieClick} 
                onPlay={(m) => {
                  addToRecentlyWatched(m);
                  setPlayingMovie(m);
                }}
              />
            )}
            
            <div className={`${activeGenre ? "pt-40" : "-mt-8"} relative z-20 space-y-4`}>
              {activeGenre ? (
                <MovieRow 
                  title={`${activeGenre.name} ${activeMediaType === "movie" ? "Movies" : "TV Shows"}`} 
                  movies={genreMovies} 
                  onMovieClick={handleMovieClick} 
                  onDownload={downloadMovie}
                  onToggleFavorite={toggleFavorite}
                  favorites={favorites}
                  downloadedIds={downloadedIds}
                  downloadingIds={downloadingIds}
                  downloadingProgress={downloadingProgress}
                />
              ) : (
                <>
                  {recentlyWatched.length > 0 && (
                    <MovieRow 
                      title="Continue Watching" 
                      movies={recentlyWatched} 
                      onMovieClick={(m) => { addToRecentlyWatched(m); setPlayingMovie(m); }} 
                      onDownload={downloadMovie}
                      onToggleFavorite={toggleFavorite}
                      favorites={favorites}
                      downloadedIds={downloadedIds}
                      downloadingIds={downloadingIds}
                      downloadingProgress={downloadingProgress}
                    />
                  )}
                  {nowPlayingMovies.length > 0 && (
                    <MovieRow 
                      title="New Releases" 
                      movies={nowPlayingMovies} 
                      onMovieClick={handleMovieClick} 
                      onDownload={downloadMovie}
                      onToggleFavorite={toggleFavorite}
                      favorites={favorites}
                      downloadedIds={downloadedIds}
                      downloadingIds={downloadingIds}
                      downloadingProgress={downloadingProgress}
                    />
                  )}
                  <MovieRow 
                    title={`Trending ${activeMediaType === "movie" ? "Movies" : "TV Shows"}`} 
                    movies={trendingMovies} 
                    onMovieClick={handleMovieClick} 
                    onDownload={downloadMovie}
                    onToggleFavorite={toggleFavorite}
                    favorites={favorites}
                    downloadedIds={downloadedIds}
                    downloadingIds={downloadingIds}
                    downloadingProgress={downloadingProgress}
                  />
                  <MovieRow 
                    title="Popular on Ruro" 
                    movies={popularMovies} 
                    onMovieClick={handleMovieClick} 
                    onDownload={downloadMovie}
                    onToggleFavorite={toggleFavorite}
                    favorites={favorites}
                    downloadedIds={downloadedIds}
                    downloadingIds={downloadingIds}
                    downloadingProgress={downloadingProgress}
                  />
                  {actionMovies.length > 0 && (
                    <MovieRow title="Action Packed" movies={actionMovies} onMovieClick={handleMovieClick} onDownload={downloadMovie} onToggleFavorite={toggleFavorite} favorites={favorites} downloadedIds={downloadedIds} downloadingIds={downloadingIds} downloadingProgress={downloadingProgress} />
                  )}
                  {comedyMovies.length > 0 && (
                    <MovieRow title="Laugh Out Loud" movies={comedyMovies} onMovieClick={handleMovieClick} onDownload={downloadMovie} onToggleFavorite={toggleFavorite} favorites={favorites} downloadedIds={downloadedIds} downloadingIds={downloadingIds} downloadingProgress={downloadingProgress} />
                  )}
                  <MovieRow 
                    title="Top Rated" 
                    movies={topRatedMovies} 
                    onMovieClick={handleMovieClick} 
                    onDownload={downloadMovie}
                    onToggleFavorite={toggleFavorite}
                    favorites={favorites}
                    downloadedIds={downloadedIds}
                    downloadingIds={downloadingIds}
                    downloadingProgress={downloadingProgress}
                  />
                  {scifiMovies.length > 0 && (
                    <MovieRow title="Sci-Fi & Fantasy" movies={scifiMovies} onMovieClick={handleMovieClick} onDownload={downloadMovie} onToggleFavorite={toggleFavorite} favorites={favorites} downloadedIds={downloadedIds} downloadingIds={downloadingIds} downloadingProgress={downloadingProgress} />
                  )}
                  {horrorMovies.length > 0 && (
                    <MovieRow title="Terrifying Thrillers" movies={horrorMovies} onMovieClick={handleMovieClick} onDownload={downloadMovie} onToggleFavorite={toggleFavorite} favorites={favorites} downloadedIds={downloadedIds} downloadingIds={downloadingIds} downloadingProgress={downloadingProgress} />
                  )}
                  {animationMovies.length > 0 && (
                    <MovieRow title="Animation Station" movies={animationMovies} onMovieClick={handleMovieClick} onDownload={downloadMovie} onToggleFavorite={toggleFavorite} favorites={favorites} downloadedIds={downloadedIds} downloadingIds={downloadingIds} downloadingProgress={downloadingProgress} />
                  )}
                  <MovieRow 
                    title="Upcoming" 
                    movies={upcomingMovies.filter(movie => movie.releaseDate && new Date(movie.releaseDate) > new Date())} 
                    onMovieClick={handleMovieClick} 
                    onDownload={downloadMovie}
                    onToggleFavorite={toggleFavorite}
                    favorites={favorites}
                    downloadedIds={downloadedIds}
                    downloadingIds={downloadingIds}
                    downloadingProgress={downloadingProgress}
                  />
                </>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <DownloadTray />

      <AnimatePresence>
        {downloadingMovie && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 px-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDownloadingMovie(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#1f232b] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-prime-blue to-netflix-red" />
              
              <h3 className="text-2xl font-black text-white mb-2">Download Quality</h3>
              <p className="text-gray-400 text-sm mb-8">Select your preferred video quality for "{downloadingMovie.title}"</p>
              
              {isFetchingQualities ? (
                <div className="flex flex-col items-center py-12 space-y-4">
                  <div className="w-10 h-10 border-4 border-prime-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm animate-pulse">Finding best available sources...</p>
                </div>
              ) : downloadError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-6">{downloadError}</p>
                  <button 
                    onClick={() => setDownloadingMovie(null)}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {availableDownloadQualities.map((source) => (
                    <button
                      key={source.quality}
                      onClick={() => startRealDownload(source)}
                      className="group relative flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left"
                    >
                      <div>
                        <p className="text-white font-bold text-lg">{source.quality}p</p>
                        <p className="text-gray-500 text-xs">Standard MP4 Format</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-prime-blue/20 flex items-center justify-center group-hover:bg-prime-blue transition-colors">
                        <Download className="w-5 h-5 text-prime-blue group-hover:text-white" />
                      </div>
                    </button>
                  ))}
                  {availableDownloadQualities.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No direct downloads available for this content.</p>
                  )}
                  <button 
                    onClick={() => setDownloadingMovie(null)}
                    className="mt-4 text-gray-500 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMovie && selectedMovie.type === "movie" && (
          <MovieDetails 
            movie={selectedMovie} 
            onClose={() => setSelectedMovie(null)} 
            onDownload={downloadMovie}
            isDownloaded={downloadedIds.has(selectedMovie.id)}
            isDownloading={downloadingIds.has(selectedMovie.id)}
            onPlay={(movie) => {
              addToRecentlyWatched(movie);
              setSelectedMovie(null);
              setPlayingMovie(movie);
            }}
          />
        )}
        {selectedMovie && selectedMovie.type === "tv" && (
          <SeriesDetails
            series={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            onPlay={(series, episode) => {
              addToRecentlyWatched(series);
              setSelectedMovie(null);
              setPlayingMovie(series);
              if (episode) {
                setPlayingEpisode(episode);
              }
            }}
            onDownload={(episode) => downloadMovie(episode as unknown as Media)}
            downloadedIds={downloadedIds}
            downloadingIds={downloadingIds}
            downloadingProgress={downloadingProgress}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playingMovie && (
          <VideoPlayer 
            mediaId={playingMovie.id} 
            type={playingMovie.type}
            title={playingMovie.title} 
            onClose={() => {
              setPlayingMovie(null);
              setPlayingEpisode(null);
            }} 
            initialSeason={playingEpisode?.seasonNumber}
            initialEpisode={playingEpisode?.episodeNumber}
            initialTime={userProgress[playingMovie.id] || 0}
            onProgressUpdate={(time) => {
               setUserProgress(prev => {
                  const updated = { ...prev, [playingMovie.id]: time };
                  localStorage.setItem("userProgress", JSON.stringify(updated));
                  return updated;
               });
               if (activeProfile && supabase) {
                  supabase.from('user_media_progress').upsert({
                     user_id: activeProfile.id,
                     media_id: playingMovie.id,
                     timestamp: time
                  }, { onConflict: 'user_id,media_id' }).then(({ error }) => {
                    if (error) console.error("Error updating progress:", error);
                  });
               }
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
