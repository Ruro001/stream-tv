import { motion, AnimatePresence } from "motion/react";
import { X, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Settings, Check } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { MediaType } from "../types";
import { movieboxService, MovieBoxSource } from "../services/movieboxService";
import { storageService } from "../services/storageService";

interface VideoPlayerProps {
  mediaId: string;
  type: MediaType;
  title: string;
  onClose: () => void;
  initialSeason?: number;
  initialEpisode?: number;
  initialTime?: number;
  onProgressUpdate?: (time: number) => void;
}

export const VideoPlayer = ({ mediaId, type, title, onClose, initialSeason = 1, initialEpisode = 1, initialTime = 0, onProgressUpdate }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [season] = useState(initialSeason);
  const [episode] = useState(initialEpisode);
  
  // Custom Controls State
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [sources, setSources] = useState<MovieBoxSource[]>([]);
  const [activeQuality, setActiveQuality] = useState<number>(360); // Default to 360p
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Attempt to lock to landscape when player opens
    if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
      (window.screen.orientation as any).lock('landscape').catch(() => {});
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (window.screen && window.screen.orientation && (window.screen.orientation as any).unlock) {
        (window.screen.orientation as any).unlock();
      }
    };
  }, []);

  // Fetch Streaming Sources
  useEffect(() => {
    let isMounted = true;
    
    const fetchMovieBoxStream = async () => {
      setIsLoading(true);
      setSearchError(null);
      
      try {
        // First check if we have it offline
        const offlineVideo = await storageService.getVideo(mediaId);
        if (offlineVideo && isMounted) {
          console.log("Playing from local offline storage!");
          const localUrl = URL.createObjectURL(offlineVideo.blob);
          setStreamUrl(localUrl);
          setActiveQuality(parseInt(offlineVideo.quality));
          setSources([{ quality: parseInt(offlineVideo.quality), streamUrl: localUrl }]);
          setIsLoading(false);
          return;
        }

        const searchResults = await movieboxService.search(title);
        if (!searchResults || searchResults.length === 0) {
          if (isMounted) setSearchError("No results found for this title on MovieBox.");
          return;
        }
        
        const targetSubjectType = type === 'tv' ? 2 : 1;
        const matchedResult = searchResults.find(r => r.subjectType === targetSubjectType) || searchResults[0];

        const mbId        = matchedResult.subjectId;
        const detailPath  = matchedResult.detailPath;
        const fetchedSources = await movieboxService.getSources(
          mbId,
          detailPath,
          type === 'tv' ? season : undefined,
          type === 'tv' ? episode : undefined
        );
        
        if (!fetchedSources || fetchedSources.length === 0) {
          if (isMounted) setSearchError("No streaming sources available yet.");
          return;
        }
        
        if (isMounted) {
          // Sort sources by quality desc
          const sorted = fetchedSources.sort((a: MovieBoxSource, b: MovieBoxSource) => b.quality - a.quality);
          setSources(sorted);

          // Find requested quality, or default to closest available to 360p
          const defaultSource = sorted.find((s: MovieBoxSource) => s.quality === 360) || sorted[sorted.length - 1];
          setActiveQuality(defaultSource.quality);
          setStreamUrl(defaultSource.streamUrl);
        }
      } catch (err) {
        if (isMounted) setSearchError("Failed to connect to MovieBox streaming server.");
        console.error(err);
      }
    };

    fetchMovieBoxStream();

    return () => {
      isMounted = false;
    };
  }, [title, type, season, episode]);

  // Handle Quality Change
  const handleQualityChange = (quality: number) => {
    const targetSource = sources.find(s => s.quality === quality);
    if (targetSource && videoRef.current) {
      const currentTimeSnapshot = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;

      setActiveQuality(quality);
      setStreamUrl(targetSource.streamUrl);
      setShowSettings(false);
      setIsLoading(true);

      // We need a slight delay to let React update the <video src> before seeking
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTimeSnapshot;
          if (wasPlaying) videoRef.current.play();
        }
      }, 300);
    }
  };

  // Video Events
  // Track last synced time to throttle callbacks
  const lastSyncTimeRef = useRef(0);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);

      if (onProgressUpdate && Math.abs(current - lastSyncTimeRef.current) > 5) {
        onProgressUpdate(current);
        lastSyncTimeRef.current = current;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      
      // Resume from previously watched time if provided
      if (initialTime > 0 && videoRef.current.duration > initialTime + 10) {
         videoRef.current.currentTime = initialTime;
         setCurrentTime(initialTime);
         lastSyncTimeRef.current = initialTime;
      }
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const skip = (amount: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const handlePointerMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettings) setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch((err) => console.log(err));
    } else {
      await document.exitFullscreen();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden select-none"
      onPointerMove={handlePointerMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Search Error State */}
      {searchError ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
            <X className="w-12 h-12 text-[#E53935]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Stream Unavailable</h3>
            <p className="text-gray-400 max-w-md">{searchError}</p>
          </div>
          <button onClick={onClose} className="bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-white/90 transition-colors">
            Go Back
          </button>
        </div>
      ) : (
        /* Video Container */
        <div className="relative flex-1 bg-black w-full h-full" onClick={togglePlay}>
          {streamUrl && (
            <video
              ref={videoRef}
              src={streamUrl}
              className="w-full h-full outline-none object-contain"
              autoPlay
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
            />
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <div className="w-16 h-16 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin mb-4" />
            </div>
          )}

          {/* Custom Controls Overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-none"
              >
                {/* Top Bar Navigation */}
                <div className="w-full p-6 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                  <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 rounded-full hover:bg-white/20 transition-colors text-white">
                    <X className="w-8 h-8" />
                  </button>
                  <div className="flex flex-col text-white">
                    <h2 className="text-lg md:text-xl font-bold drop-shadow-lg leading-tight">{title}</h2>
                    {type === "tv" && (
                      <p className="text-gray-300 text-xs md:text-sm font-medium drop-shadow-md">
                        S{season} E{episode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Center Giant Action Buttons */}
                <div className="absolute inset-0 flex items-center justify-center gap-16 md:gap-32 pointer-events-none">
                  {/* Skip Back 10 */}
                  <button 
                    onClick={(e) => skip(-10, e)}
                    className="p-4 md:p-6 rounded-full bg-black/40 text-white hover:bg-black/60 hover:scale-110 transition-all pointer-events-auto backdrop-blur-md"
                  >
                    <RotateCcw className="w-8 h-8 md:w-12 md:h-12" />
                    <span className="block text-[10px] md:text-xs font-bold mt-1 text-center">10s</span>
                  </button>

                  {/* Play/Pause Center Indicator */}
                  {!isPlaying && (
                    <button 
                      onClick={togglePlay}
                      className="p-6 md:p-8 rounded-full bg-black/40 text-white hover:bg-[#E53935] hover:scale-110 transition-all pointer-events-auto backdrop-blur-md"
                    >
                      <Play className="w-10 h-10 md:w-16 md:h-16 fill-current ml-2" />
                    </button>
                  )}
                  {isPlaying && <div className="w-[88px] h-[88px] md:w-[112px] md:h-[112px]"></div> /* Placeholder spacing */}

                  {/* Skip Forward 10 */}
                  <button 
                    onClick={(e) => skip(10, e)}
                    className="p-4 md:p-6 rounded-full bg-black/40 text-white hover:bg-black/60 hover:scale-110 transition-all pointer-events-auto backdrop-blur-md"
                  >
                    <RotateCw className="w-8 h-8 md:w-12 md:h-12" />
                    <span className="block text-[10px] md:text-xs font-bold mt-1 text-center">10s</span>
                  </button>
                </div>

                {/* Bottom Bar Controls */}
                <div 
                  className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 md:p-6 lg:px-8 pointer-events-auto relative pt-12"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Playback Scrubber */}
                  <div className="absolute top-0 left-0 right-0 px-4 md:px-6 lg:px-8 -translate-y-1/2 group">
                    <input 
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 md:h-2 rounded-full appearance-none bg-white/20 cursor-pointer accent-[#E53935] hover:h-2.5 transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between text-white mt-2">
                    {/* Left side standard controls */}
                    <div className="flex items-center gap-4 md:gap-6">
                      <button onClick={togglePlay} className="hover:text-[#E53935] hover:scale-110 transition-all">
                        {isPlaying ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />}
                      </button>
                      
                      <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="hover:text-gray-300 transition-all">
                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
                      </button>

                      <div className="text-xs md:text-sm font-medium tabular-nums pl-2 border-l border-white/20 text-gray-300">
                        {formatTime(currentTime)} <span className="text-gray-500 mx-1">/</span> {formatTime(duration)}
                      </div>
                    </div>

                    {/* Right side popups and controls */}
                    <div className="flex items-center gap-4 md:gap-6">
                      
                      {/* Quality Settings Menu */}
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                          className={`flex items-center gap-1.5 hover:text-white transition-all font-bold px-2 py-1 rounded bg-white/10 ${showSettings ? "text-white bg-white/20" : "text-gray-300"}`}
                        >
                          <Settings className="w-4 h-4 md:w-5 md:h-5" />
                          <span className="text-xs md:text-sm">{activeQuality}p</span>
                        </button>
                        
                        <AnimatePresence>
                          {showSettings && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute bottom-full right-0 mb-4 bg-[#18181b] border border-white/10 rounded-lg shadow-2xl py-2 min-w-[140px] overflow-hidden"
                            >
                              <div className="px-4 py-2 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Video Quality
                              </div>
                              {sources.map((src) => (
                                <button
                                    key={src.quality}
                                    onClick={() => handleQualityChange(src.quality)}
                                    className="w-full px-4 py-3 text-left text-sm md:text-base font-semibold hover:bg-white/10 flex flex-row items-center justify-between text-white transition-colors"
                                  >
                                    <span>{src.quality}p</span>
                                    {activeQuality === src.quality && <Check className="w-4 h-4 text-[#E53935]" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button onClick={toggleFullscreen} className="hover:text-white text-gray-300 transition-colors">
                        <Maximize className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
