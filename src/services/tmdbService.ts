import { Media, WatchProvider, MediaType } from "../types";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// List of free providers we want to highlight
const FREE_PROVIDERS = ["Tubi TV", "Pluto TV", "Plex", "Crackle", "Freevee", "VUDU Free", "YouTube Free"];

const mapTMDBMedia = (tmdbMedia: any, type: MediaType = "movie", isTrending: boolean = false): Media => ({
  id: tmdbMedia.id.toString(),
  type,
  title: tmdbMedia.title || tmdbMedia.name,
  description: tmdbMedia.overview,
  thumbnail: tmdbMedia.poster_path ? `${IMAGE_BASE_URL}/w500${tmdbMedia.poster_path}` : "https://picsum.photos/seed/movie/500/750",
  backdrop: tmdbMedia.backdrop_path ? `${IMAGE_BASE_URL}/original${tmdbMedia.backdrop_path}` : (tmdbMedia.poster_path ? `${IMAGE_BASE_URL}/original${tmdbMedia.poster_path}` : "https://picsum.photos/seed/movie/1920/1080"),
  rating: tmdbMedia.vote_average ? Number(tmdbMedia.vote_average.toFixed(1)) : 0,
  year: new Date(tmdbMedia.release_date || tmdbMedia.first_air_date).getFullYear() || new Date().getFullYear(),
  duration: type === "movie" ? "2h 15m" : "8 Seasons", // Default for list view
  genre: [], 
  isTrending,
  isNew: tmdbMedia.vote_count > 1000,
  releaseDate: tmdbMedia.release_date || tmdbMedia.first_air_date,
});

export const tmdbService = {
  async getTrending(type: MediaType = "movie"): Promise<Media[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results.map((m: any, index: number) => mapTMDBMedia(m, type, index < 10));
    } catch (error) {
      console.error(`Error fetching trending ${type}:`, error);
      return [];
    }
  },

  async getTopRated(type: MediaType = "movie"): Promise<Media[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/${type}/top_rated?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results.map((m: any) => mapTMDBMedia(m, type));
    } catch (error) {
      console.error(`Error fetching top rated ${type}:`, error);
      return [];
    }
  },

  async getPopular(type: MediaType = "movie"): Promise<Media[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/${type}/popular?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results.map((m: any) => mapTMDBMedia(m, type));
    } catch (error) {
      console.error(`Error fetching popular ${type}:`, error);
      return [];
    }
  },

  async getNowPlaying(type: MediaType = "movie"): Promise<Media[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const endpoint = type === "movie" ? "movie/now_playing" : "tv/airing_today";
      const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results.map((m: any) => mapTMDBMedia(m, type));
    } catch (error) {
      console.error(`Error fetching now playing ${type}:`, error);
      return [];
    }
  },

  async getUpcoming(type: MediaType = "movie"): Promise<Media[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const endpoint = type === "movie" ? "movie/upcoming" : "tv/on_the_air";
      const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results.map((m: any) => mapTMDBMedia(m, type));
    } catch (error) {
      console.error(`Error fetching upcoming ${type}:`, error);
      return [];
    }
  },

  async searchMedia(query: string): Promise<Media[]> {
    if (!TMDB_API_KEY || !query) return [];
    try {
      // Search both movies and TV shows
      const [movieRes, tvRes] = await Promise.all([
        fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`),
        fetch(`${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`),
      ]);
      
      const movieData = await movieRes.json();
      const tvData = await tvRes.json();
      
      const movies = movieData.results.map((m: any) => mapTMDBMedia(m, "movie"));
      const tvShows = tvData.results.map((m: any) => mapTMDBMedia(m, "tv"));
      
      return [...movies, ...tvShows].sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.error("Error searching media:", error);
      return [];
    }
  },

  async getMediaDetails(mediaId: string, type: MediaType = "movie"): Promise<Partial<Media>> {
    if (!TMDB_API_KEY) return {};
    try {
      const [detailsRes, providersRes, videosRes] = await Promise.all([
        fetch(`${BASE_URL}/${type}/${mediaId}?api_key=${TMDB_API_KEY}`),
        fetch(`${BASE_URL}/${type}/${mediaId}/watch/providers?api_key=${TMDB_API_KEY}`),
        fetch(`${BASE_URL}/${type}/${mediaId}/videos?api_key=${TMDB_API_KEY}`),
      ]);

      const details = await detailsRes.json();
      const providersData = await providersRes.json();
      const videosData = await videosRes.json();

      // Extract free providers
      const countryProviders = providersData.results?.US || providersData.results?.GB || {};
      const allProviders = [
        ...(countryProviders.flatrate || []),
        ...(countryProviders.ads || []),
        ...(countryProviders.free || []),
      ];

      const freeProviders: WatchProvider[] = allProviders
        .filter((p: any) => FREE_PROVIDERS.includes(p.provider_name))
        .map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logo: `${IMAGE_BASE_URL}/w200${p.logo_path}`,
          url: `https://www.themoviedb.org/${type}/${mediaId}/watch`, 
        }));

      // Find trailer
      const trailer = videosData.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");

      return {
        duration: type === "movie" 
          ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
          : `${details.number_of_seasons} Seasons`,
        genre: details.genres?.map((g: any) => g.name) || [],
        watchProviders: freeProviders,
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
        seasons: details.number_of_seasons,
        episodes: details.number_of_episodes,
      };
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      return {};
    }
  },

  async getEpisodes(seriesId: string, seasonNumber: number): Promise<any[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return (data.episodes || []).map((ep: any) => ({
        id: ep.id.toString(),
        episodeNumber: ep.episode_number,
        seasonNumber: ep.season_number,
        title: ep.name,
        description: ep.overview,
        thumbnail: ep.still_path ? `${IMAGE_BASE_URL}/w500${ep.still_path}` : '',
        duration: ep.runtime ? `${ep.runtime}m` : '45m',
      }));
    } catch (error) {
      console.error(`Error fetching episodes for series ${seriesId} season ${seasonNumber}:`, error);
      return [];
    }
  },

  async getGenres(type: MediaType = "movie"): Promise<{ id: number; name: string }[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.genres || [];
    } catch (error) {
      console.error(`Error fetching ${type} genres:`, error);
      return [];
    }
  },

  async getMediaByGenre(type: MediaType = "movie", genreId: number): Promise<Media[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&with_genres=${genreId}`);
      const data = await response.json();
      return data.results.map((m: any) => mapTMDBMedia(m, type));
    } catch (error) {
      console.error(`Error fetching ${type} by genre ${genreId}:`, error);
      return [];
    }
  },

  async getRecommendations(mediaId: string, type: MediaType = "movie"): Promise<Media[]> {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/${type}/${mediaId}/recommendations?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results.map((m: any) => mapTMDBMedia(m, type));
    } catch (error) {
      console.error(`Error fetching recommendations for ${type} ${mediaId}:`, error);
      return [];
    }
  }
};
