import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";
import { MediaType, UserProfile } from "../types";

interface NavbarProps {
  onSearch: (query: string) => void;
  activeMediaType: MediaType;
  onMediaTypeChange: (type: MediaType) => void;
  activeProfile: UserProfile | null;
  onProfileClick: () => void;
  genres: { id: number; name: string }[];
  activeGenre: { id: number; name: string } | null;
  onGenreChange: (genre: { id: number; name: string } | null) => void;
}

export const Navbar = ({
  onSearch,
  activeMediaType,
  onMediaTypeChange,
  activeProfile,
  onProfileClick,
  genres,
  activeGenre,
  onGenreChange,
}: NavbarProps) => {
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
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 px-4 md:px-12 py-3 flex items-center justify-between ${
        isScrolled
          ? "bg-[#1f232b]/95 backdrop-blur-md shadow-lg border-b border-white/5"
          : "bg-gradient-to-b from-black/90 via-black/40 to-transparent"
      }`}
    >
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* LOGO */}
        <div
          className="flex items-center cursor-pointer py-1"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img
            src="/logo.png"
            alt="RURO TV"
            className="h-7 md:h-11 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/200x80/black/red?text=RURO+TV";
            }}
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
                    onClick={() => {
                      setSearchQuery("");
                      onSearch("");
                    }}
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
          className={`text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeMediaType === "movie"
              ? "text-[#E53935] border-b-2 border-[#E53935] pb-1"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Movies
        </button>
        <button
          onClick={() => onMediaTypeChange("tv")}
          className={`text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeMediaType === "tv"
              ? "text-[#E53935] border-b-2 border-[#E53935] pb-1"
              : "text-gray-300 hover:text-white"
          }`}
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
            className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-white text-sm font-black cursor-pointer ring-2 ring-transparent hover:ring-white/40 transition-all shadow-lg ${
              activeProfile.color || "bg-prime-blue"
            }`}
          >
            {activeProfile.avatar}
          </div>
        )}
      </div>
    </nav>
  );
};
