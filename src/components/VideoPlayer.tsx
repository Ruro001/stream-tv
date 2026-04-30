import { motion, AnimatePresence } from "motion/react";
import { 
  X, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Settings, Check,
  ThumbsUp, ThumbsDown, Cast, Scissors, List, MessageSquare, SkipForward, Gauge, Sun
} from "lucide-react";
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
  onProgressUpdate?: (time: number, duration: number) => void;
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
  const [isFitScreen, setIsFitScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // New features state
  const [brightness, setBrightness] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showLeftControl, setShowLeftControl] = useState(false);
  const [showPlaybackSpeedOptions, setShowPlaybackSpeedOptions] = useState(false);

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skip(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skip(10);
      } else if (e.code === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
          if (wasPlaying) {
            videoRef.current.play().catch(e => {
              if (e.name !== 'AbortError') console.error("Play aborted:", e);
            });
          }
        }
      }, 300);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackSpeedOptions(false);
    }
  };

  // Video Events
  const lastSyncTimeRef = useRef(0);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);

      if (onProgressUpdate && Math.abs(current - lastSyncTimeRef.current) > 5) {
        onProgressUpdate(current, videoRef.current.duration);
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
         // Fix Persistence playing: explicitly call play after setting currentTime
         videoRef.current.play().catch(e => console.error("Failed to resume playback:", e));
      }
    }
  };

  const togglePlay = (e?: React.MouseEvent | Event) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => {
          if (err.name !== 'AbortError') console.error("Play failed:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  };

  const skip = (amount: number, e?: React.MouseEvent | Event) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const handlePointerMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !showSettings && !showPlaybackSpeedOptions && !showLeftControl) {
        setShowControls(false);
      }
    }, 4000); // 4 seconds auto-hide
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
      if (!newMuted && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
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
    if (timeInSeconds >= 3600) {
      const h = Math.floor(timeInSeconds / 3600).toString();
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  // Sync isPlaying state with actual video state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const updatePlayState = () => setIsPlaying(!video.paused);
    
    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);
    
    return () => {
      video.removeEventListener('play', updatePlayState);
      video.removeEventListener('pause', updatePlayState);
    };
  }, []);

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden select-none font-sans"
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
        <div 
          className="relative flex-1 bg-black w-full h-full" 
          onDoubleClick={() => setIsFitScreen(!isFitScreen)}
        >
          {streamUrl && (
            <video
              ref={videoRef}
              src={streamUrl}
              className={`w-full h-full outline-none transition-all duration-300 ${isFitScreen ? 'object-cover' : 'object-contain'}`}
              style={{ filter: `brightness(${brightness}%)` }}
              autoPlay
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
            />
          )}

          {/* Subtitles Overlay */}
          {showSubtitles && (
            <div className="absolute bottom-28 md:bottom-32 left-0 right-0 flex justify-center pointer-events-none z-20 px-8">
              <div className="px-6 py-2 bg-black/40 rounded backdrop-blur-md border border-white/5">
                <p className="text-white text-lg md:text-xl font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center tracking-wide">
                  [Subtitles generated dynamically]
                </p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
              >
                <div className="w-16 h-16 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin mb-4" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left Side Control: Brightness */}
          <div 
            className="absolute top-1/4 bottom-1/4 left-0 w-24 md:w-32 z-30"
            onMouseEnter={() => setShowLeftControl(true)}
            onMouseLeave={() => setShowLeftControl(false)}
            onPointerMove={(e) => {
              e.stopPropagation();
              setShowLeftControl(true);
            }}
          >
            <AnimatePresence>
              {showLeftControl && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-56 w-12 bg-black/40 backdrop-blur-md rounded-full flex flex-col items-center justify-between py-6 border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Sun className="w-5 h-5 text-white/90" />
                  <div className="relative h-32 w-full flex justify-center">
                    <input 
                      type="range"
                      min="20"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 appearance-none w-32 h-1 bg-white/20 rounded-full origin-center -rotate-90 accent-white cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom Controls Overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-none"
              >
                {/* Top Bar Navigation */}
                <div className="w-full p-6 md:px-10 md:py-8 flex items-start justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-auto">
                  <div className="flex flex-col text-white max-w-[60%]">
                    <h2 className="text-xl md:text-3xl font-bold drop-shadow-xl leading-tight truncate">{title}</h2>
                    {type === "tv" && (
                      <p className="text-gray-300 text-sm md:text-base font-semibold drop-shadow-md mt-1">
                        S{season} E{episode}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-5 md:gap-8 text-white">
                    <button onClick={(e) => { e.stopPropagation(); setIsFitScreen(!isFitScreen); }} className="hover:text-white text-gray-300 hover:scale-110 transition-all font-bold text-xs uppercase tracking-widest border border-white/20 rounded-full px-3 py-1 bg-black/40 backdrop-blur-sm hidden sm:block">
                      {isFitScreen ? 'Fit to Screen' : 'Fill Screen'}
                    </button>
                    <button onClick={(e) => e.stopPropagation()} className="hover:text-white text-gray-300 hover:scale-110 transition-all hidden sm:block">
                      <ThumbsUp className="w-6 h-6" />
                    </button>
                    <button onClick={(e) => e.stopPropagation()} className="hover:text-white text-gray-300 hover:scale-110 transition-all hidden sm:block">
                      <ThumbsDown className="w-6 h-6" />
                    </button>

                    <div className="group flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={toggleMute} className="hover:text-white text-gray-300 transition-all">
                        {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                      <input 
                        type="range" 
                        min={0} max={1} step={0.05} 
                        value={isMuted ? 0 : volume} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setVolume(val);
                          if (videoRef.current) videoRef.current.volume = val;
                          if (val > 0) setIsMuted(false);
                        }}
                        className="w-0 opacity-0 group-hover:w-24 group-hover:opacity-100 transition-all duration-300 h-1 accent-white bg-white/30 rounded-full appearance-none cursor-pointer hidden sm:block"
                      />
                    </div>

                    <button onClick={(e) => e.stopPropagation()} className="hover:text-white text-gray-300 transition-all hidden sm:block">
                      <Cast className="w-6 h-6" />
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:bg-white/20 p-2 -mr-2 rounded-full transition-colors ml-2 md:ml-4">
                      <X className="w-8 h-8 md:w-10 md:h-10" />
                    </button>
                  </div>
                </div>

                {/* Center Giant Action Buttons */}
                <div className="absolute inset-0 flex items-center justify-center gap-16 md:gap-32 pointer-events-none">
                  {/* Skip Back 10 */}
                  <button 
                    onClick={(e) => skip(-10, e)}
                    className="p-3 md:p-4 rounded-full bg-black/30 border border-white/10 text-white hover:bg-black/50 hover:scale-110 transition-all pointer-events-auto backdrop-blur-md shadow-2xl"
                  >
                    <RotateCcw className="w-6 h-6 md:w-8 md:h-8" />
                  </button>

                  {/* Play/Pause Center Indicator */}
                  <button 
                    onClick={togglePlay}
                    className="p-4 md:p-6 rounded-full bg-black/40 border border-white/10 text-white hover:bg-[#E53935]/90 hover:scale-110 transition-all pointer-events-auto backdrop-blur-md shadow-2xl"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 md:w-12 md:h-12 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 md:w-12 md:h-12 fill-current ml-1.5" />
                    )}
                  </button>

                  {/* Skip Forward 10 */}
                  <button 
                    onClick={(e) => skip(10, e)}
                    className="p-3 md:p-4 rounded-full bg-black/30 border border-white/10 text-white hover:bg-black/50 hover:scale-110 transition-all pointer-events-auto backdrop-blur-md shadow-2xl"
                  >
                    <RotateCw className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                </div>

                {/* Bottom Bar Controls */}
                <div 
                  className="w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-16 pb-6 px-6 md:px-10 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Playback Scrubber */}
                  <div className="flex items-center gap-4 mb-6 group">
                    <span className="text-white/90 text-sm tabular-nums font-semibold w-14 text-right">
                      {formatTime(currentTime)}
                    </span>
                    <div className="relative flex-1 flex items-center h-4 cursor-pointer" onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pos = (e.clientX - rect.left) / rect.width;
                      if (videoRef.current) {
                        videoRef.current.currentTime = pos * duration;
                        setCurrentTime(pos * duration);
                      }
                    }}>
                      <div className="absolute w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#E53935]" 
                          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                      </div>
                      <input 
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute w-full h-full opacity-0 cursor-pointer"
                      />
                      <div 
                        className="absolute h-3.5 w-3.5 bg-[#E53935] rounded-full shadow hover:scale-125 transition-transform pointer-events-none"
                        style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 7px)` }}
                      />
                    </div>
                    <span className="text-white/60 text-sm tabular-nums font-semibold w-14">
                      {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white">
                    {/* Left side actions */}
                    <div className="flex items-center gap-6 md:gap-8">
                      <button onClick={togglePlay} className="hover:text-white text-gray-300 hover:scale-110 transition-all">
                        {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
                      </button>

                      <div className="hidden md:flex items-center gap-6 text-gray-300">
                        <button onClick={(e) => skip(-10, e)} className="hover:text-white hover:-rotate-12 transition-all"><RotateCcw className="w-6 h-6"/></button>
                        <button onClick={(e) => skip(10, e)} className="hover:text-white hover:rotate-12 transition-all"><RotateCw className="w-6 h-6"/></button>
                      </div>
                    </div>

                    {/* Right side popups and actions */}
                    <div className="flex items-center gap-5 md:gap-8">
                      
                      {/* Quality Settings Menu */}
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowPlaybackSpeedOptions(false); }}
                          className={`flex items-center gap-2 hover:text-white transition-all font-semibold ${showSettings ? "text-white" : "text-gray-300"}`}
                        >
                          <Settings className="w-5 h-5 md:w-6 md:h-6" />
                          <span className="text-sm md:text-base hidden sm:inline-block">{activeQuality}p</span>
                        </button>
                        
                        <AnimatePresence>
                          {showSettings && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute bottom-full right-0 mb-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 min-w-[160px] overflow-hidden"
                            >
                              <div className="px-5 py-3 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Quality
                              </div>
                              {sources.map((src) => (
                                <button
                                    key={src.quality}
                                    onClick={() => handleQualityChange(src.quality)}
                                    className="w-full px-5 py-3 text-left text-sm md:text-base font-semibold hover:bg-white/10 flex flex-row items-center justify-between text-white transition-colors"
                                  >
                                    <span>{src.quality}p</span>
                                    {activeQuality === src.quality && <Check className="w-4 h-4 text-[#E53935]" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Clip */}
                      <button className="flex flex-col items-center gap-1.5 hover:text-white text-gray-300 transition-colors group">
                        <Scissors className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
                        <span className="text-[10px] hidden lg:block font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">Clip</span>
                      </button>

                      {/* Speed */}
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowPlaybackSpeedOptions(!showPlaybackSpeedOptions); setShowSettings(false); }}
                          className={`flex flex-col items-center gap-1.5 transition-colors group ${showPlaybackSpeedOptions ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                          <Gauge className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
                          <span className="text-[10px] hidden lg:block font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">{playbackRate}x Speed</span>
                        </button>
                        
                        <AnimatePresence>
                          {showPlaybackSpeedOptions && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 min-w-[140px] overflow-hidden"
                            >
                              <div className="px-5 py-3 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Speed
                              </div>
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                <button
                                    key={rate}
                                    onClick={() => handlePlaybackRateChange(rate)}
                                    className="w-full px-5 py-3 text-left text-sm md:text-base font-semibold hover:bg-white/10 flex flex-row items-center justify-between text-white transition-colors"
                                  >
                                    <span>{rate}x</span>
                                    {playbackRate === rate && <Check className="w-4 h-4 text-[#E53935]" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Episodes */}
                      {type === "tv" && (
                        <button className="flex flex-col items-center gap-1.5 hover:text-white text-gray-300 transition-colors group">
                          <List className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
                          <span className="text-[10px] hidden lg:block font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">Episodes</span>
                        </button>
                      )}

                      {/* Subtitles */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowSubtitles(!showSubtitles); }}
                        className={`flex flex-col items-center gap-1.5 transition-colors group ${showSubtitles ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                      >
                        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
                        <span className="text-[10px] hidden lg:block font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">Subtitles</span>
                      </button>

                      {/* Next Episode */}
                      {type === "tv" && (
                        <button className="flex flex-col items-center gap-1.5 hover:text-white text-gray-300 transition-colors group">
                          <SkipForward className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
                          <span className="text-[10px] hidden lg:block font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">Next</span>
                        </button>
                      )}

                      {/* Fullscreen */}
                      <button onClick={toggleFullscreen} className="flex flex-col items-center gap-1.5 hover:text-white text-gray-300 transition-colors group ml-2">
                        <Maximize className="w-5 h-5 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] hidden lg:block font-bold uppercase tracking-wider text-transparent select-none">FS</span>
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
