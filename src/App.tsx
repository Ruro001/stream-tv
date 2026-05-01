/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, memo } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Info, 
  Plus, 
  Search, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ArrowDownToLine, 
  LogOut, 
  Download, 
  Settings, 
  Clock, 
  Pause,
  ChevronDown,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Heart,
  Star
} from "lucide-react";
import { Media, WatchProvider, UserProfile, MediaType, Episode, DownloadStatus } from "./types";
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
import { LoginScreen, UpdatePasswordScreen } from "./components/AuthScreens";
import { movieboxService, MovieBoxSource } from "./services/movieboxService";
import { storageService } from "./services/storageService";
import { DownloadTray } from "./components/DownloadTray";
import { downloadManager } from "./services/downloadManager";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SkeletonRow, SkeletonHero } from "./components/SkeletonCard";
import { hapticsService } from "./services/hapticsService";

import { HomePage } from "./components/HomePage";
import { Navbar } from "./components/Navbar";
import { BottomNav } from "./components/BottomNav";
import { SeriesDetails } from "./components/SeriesDetails";
import { MovieDetails } from "./components/MovieDetails";

const DEFAULT_PROFILES: UserProfile[] = [
  { id: "1", name: "Favour", avatar: "F", color: "bg-prime-blue" },
  { id: "2", name: "Kids", avatar: "K", color: "bg-green-500" },
  { id: "3", name: "Guest", avatar: "G", color: "bg-netflix-red" },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appState, setAppState] = useState<'loading' | 'login' | 'main' | 'update-password'>('loading');
  const [selectedMovie, setSelectedMovie] = useState<Media | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Media | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const activeTab = location.pathname === "/" ? "home" : location.pathname.split('/')[1];
  const setActiveTab = (tab: string) => {
    navigate(tab === 'home' ? '/' : `/${tab}`);
  };

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
  const [downloadingProgress, setDownloadingProgress] = useState<Record<string, {
    progress: number;
    receivedBytes: number;
    totalBytes: number;
    speed: number;
    status: DownloadStatus;
  }>>({});
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAppState('update-password');
      } else if (event === 'SIGNED_OUT') {
        setAppState('login');
      } else {
        setAppState(session ? 'main' : 'login');
      }
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
    setDownloadingProgress(prev => ({ 
      ...prev, 
      [movieId]: { 
        progress: 0, 
        receivedBytes: 0, 
        totalBytes: 0, 
        speed: 0, 
        status: 'downloading' as DownloadStatus 
      } 
    }));
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
      } else if (state.status === 'idle') {
         setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(state.mediaId);
          return next;
        });
      } else {
        // Handle downloading, paused, error
        setDownloadingIds(prev => new Set(prev).add(state.mediaId));
        setDownloadingProgress(prev => ({ 
          ...prev, 
          [state.mediaId]: {
            progress: state.progress,
            receivedBytes: state.receivedBytes,
            totalBytes: state.totalBytes,
            speed: state.speed,
            status: state.status
          } 
        }));
      }
    });

    return () => { unsubscribe(); };
  }, []);

  const downloadedMovies = allMovies.filter(m => downloadedIds.has(m.id));
  const currentlyDownloading = allMovies.filter(m => downloadingIds.has(m.id));
  const allDownloadItems = [...currentlyDownloading, ...downloadedMovies];

  const handlePauseDownload = (mediaId: string) => {
    downloadManager.pauseDownload(mediaId);
  };

  const handleResumeDownload = async (mediaId: string) => {
    const state = downloadManager.getActiveDownloads().find(d => d.mediaId === mediaId);
    if (state) {
      // Stream URLs expire, so we must fetch a fresh one to resume
      try {
        const searchResults = await movieboxService.search(state.movie.title);
        const match = searchResults.find(r => r.subjectType === (state.movie.type === 'tv' ? 2 : 1)) || searchResults[0];
        
        if (match) {
          const sources = await movieboxService.getSources(match.subjectId, match.detailPath, state.movie.type === 'tv' ? 1 : undefined, state.movie.type === 'tv' ? 1 : undefined);
          if (sources && sources.length > 0) {
             const bestSource = sources.sort((a, b) => b.quality - a.quality)[0];
             downloadManager.startDownload(state.movie, bestSource.downloadUrl, `${bestSource.quality}p`);
          } else {
             alert("Could not find a fresh download link to resume.");
          }
        }
      } catch (e) {
        console.error("Failed to fetch fresh resume URL", e);
        alert("Failed to resume download.");
      }
    }
  };

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

      {appState === 'login' ? (
        <LoginScreen onLogin={() => setAppState('main')} />
      ) : appState === 'update-password' ? (
        <UpdatePasswordScreen onSuccess={() => setAppState('main')} />
      ) : (
        <>
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

            <Routes>
              <Route path="/" element={
                searchQuery !== "" && isOnline ? (
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
                            progressDetails={downloadingProgress[movie.id]}
                            onPause={handlePauseDownload}
                            onResume={handleResumeDownload}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-24 md:py-32 text-gray-500 text-lg md:text-xl font-medium">
                        No movies found matching your search.
                      </div>
                    )}
                  </div>
                ) : (
                  <HomePage 
                    isLoading={isLoading}
                    trendingMovies={trendingMovies}
                    popularMovies={popularMovies}
                    topRatedMovies={topRatedMovies}
                    nowPlayingMovies={nowPlayingMovies}
                    upcomingMovies={upcomingMovies}
                    actionMovies={actionMovies}
                    comedyMovies={comedyMovies}
                    scifiMovies={scifiMovies}
                    horrorMovies={horrorMovies}
                    animationMovies={animationMovies}
                    recentlyWatched={recentlyWatched}
                    genreMovies={genreMovies}
                    activeGenre={activeGenre}
                    activeMediaType={activeMediaType}
                    handleMovieClick={handleMovieClick}
                    downloadMovie={downloadMovie}
                    toggleFavorite={toggleFavorite}
                    favorites={favorites}
                    downloadedIds={downloadedIds}
                    downloadingIds={downloadingIds}
                    downloadingProgress={downloadingProgress}
                    handlePauseDownload={handlePauseDownload}
                    handleResumeDownload={handleResumeDownload}
                    addToRecentlyWatched={addToRecentlyWatched}
                    setPlayingMovie={setPlayingMovie}
                  />
                )
              } />
              <Route path="/favorites" element={
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
              } />
              <Route path="/downloads" element={
                <DownloadsPage 
                  downloadedIds={downloadedIds}
                  downloadingIds={downloadingIds}
                  downloadingProgress={downloadingProgress}
                  onMovieClick={handleMovieClick}
                  onDownload={downloadMovie}
                  onToggleFavorite={toggleFavorite}
                  favorites={favorites}
                  onPause={handlePauseDownload}
                  onResume={handleResumeDownload}
                />
              } />
              <Route path="/for-you" element={
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
              } />
              <Route path="/profile" element={
                <ProfilePage onLogout={async () => {
                  await supabase?.auth.signOut();
                  setAppState('login');
                  navigate('/');
                }} />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          <DownloadTray />
        </>
      )}

      {/* Modals and Overlays */}
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
          <ErrorBoundary fallbackTitle="Player Error" fallbackMessage="The video player encountered an issue. Please try again.">
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
            onProgressUpdate={(time, duration) => {
               if (time > duration * 0.9) {
                 // Over 90% watched, remove from continue watching
                 setRecentlyWatched(prev => {
                   const next = prev.filter(m => m.id !== playingMovie.id);
                   localStorage.setItem("recentlyWatched", JSON.stringify(next));
                   return next;
                 });
                 setUserProgress(prev => {
                   const next = { ...prev };
                   delete next[playingMovie.id];
                   localStorage.setItem("userProgress", JSON.stringify(next));
                   return next;
                 });
                 if (activeProfile && supabase) {
                    supabase.from('user_media_progress').delete().match({ user_id: activeProfile.id, media_id: playingMovie.id }).then();
                 }
               } else {
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
               }
            }}
          />
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </div>
  );
}
