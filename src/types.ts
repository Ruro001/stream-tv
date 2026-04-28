/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WatchProvider {
  id: number;
  name: string;
  logo: string;
  url: string;
}

export type MediaType = "movie" | "tv";

export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
}

export interface Media {
  id: string;
  type: MediaType;
  title: string;
  description: string;
  thumbnail: string;
  backdrop: string;
  rating: number;
  year: number;
  duration: string; // For TV, this might be "8 Seasons"
  genre: string[];
  isTrending?: boolean;
  isNew?: boolean;
  trailerUrl?: string;
  watchProviders?: WatchProvider[];
  // TV specific
  seasons?: number;
  episodes?: number;
  releaseDate?: string;
}

// Alias for backward compatibility
export type Movie = Media;

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export type DownloadStatus = 'idle' | 'fetching_sources' | 'downloading' | 'paused' | 'completed' | 'error';

export interface DownloadState {
  mediaId: string;
  movie: Media;
  status: DownloadStatus;
  progress: number;
  receivedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  streamUrl?: string; // Cache the URL for resume
  error?: string;
  abortController?: AbortController;
}
