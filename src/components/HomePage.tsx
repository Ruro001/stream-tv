import React from "react";
import { Media, MediaType } from "../types";
import { Hero } from "./Hero";
import { MovieRow } from "./MovieRow";
import { SkeletonHero, SkeletonRow } from "./SkeletonCard";
import { MOCK_MOVIES } from "../constants";

interface HomePageProps {
  isLoading: boolean;
  trendingMovies: Media[];
  popularMovies: Media[];
  topRatedMovies: Media[];
  nowPlayingMovies: Media[];
  upcomingMovies: Media[];
  actionMovies: Media[];
  comedyMovies: Media[];
  scifiMovies: Media[];
  horrorMovies: Media[];
  animationMovies: Media[];
  recentlyWatched: Media[];
  genreMovies: Media[];
  activeGenre: { id: number; name: string } | null;
  activeMediaType: MediaType;
  handleMovieClick: (movie: Media) => void;
  downloadMovie: (movie: Media) => void;
  toggleFavorite: (movie: Media) => void;
  favorites: Set<string>;
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingProgress: Record<string, any>;
  handlePauseDownload: (id: string) => void;
  handleResumeDownload: (id: string) => void;
  addToRecentlyWatched: (movie: Media) => void;
  setPlayingMovie: (movie: Media) => void;
}

export const HomePage = ({
  isLoading,
  trendingMovies,
  popularMovies,
  topRatedMovies,
  nowPlayingMovies,
  upcomingMovies,
  actionMovies,
  comedyMovies,
  scifiMovies,
  horrorMovies,
  animationMovies,
  recentlyWatched,
  genreMovies,
  activeGenre,
  activeMediaType,
  handleMovieClick,
  downloadMovie,
  toggleFavorite,
  favorites,
  downloadedIds,
  downloadingIds,
  downloadingProgress,
  handlePauseDownload,
  handleResumeDownload,
  addToRecentlyWatched,
  setPlayingMovie,
}: HomePageProps) => {
  return (
    <>
      {!activeGenre && (
        isLoading ? (
          <SkeletonHero />
        ) : (
          <Hero
            movies={trendingMovies.length > 0 ? trendingMovies : MOCK_MOVIES}
            onInfoClick={handleMovieClick}
            onPlay={(m) => {
              addToRecentlyWatched(m);
              setPlayingMovie(m);
            }}
          />
        )
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
            onPause={handlePauseDownload}
            onResume={handleResumeDownload}
          />
        ) : isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          <>
            {recentlyWatched.length > 0 && (
              <MovieRow
                title="Continue Watching"
                movies={recentlyWatched}
                onMovieClick={(m) => {
                  addToRecentlyWatched(m);
                  setPlayingMovie(m);
                }}
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
              <MovieRow
                title="Action Packed"
                movies={actionMovies}
                onMovieClick={handleMovieClick}
                onDownload={downloadMovie}
                onToggleFavorite={toggleFavorite}
                favorites={favorites}
                downloadedIds={downloadedIds}
                downloadingIds={downloadingIds}
                downloadingProgress={downloadingProgress}
              />
            )}
            {comedyMovies.length > 0 && (
              <MovieRow
                title="Laugh Out Loud"
                movies={comedyMovies}
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
              <MovieRow
                title="Sci-Fi & Fantasy"
                movies={scifiMovies}
                onMovieClick={handleMovieClick}
                onDownload={downloadMovie}
                onToggleFavorite={toggleFavorite}
                favorites={favorites}
                downloadedIds={downloadedIds}
                downloadingIds={downloadingIds}
                downloadingProgress={downloadingProgress}
              />
            )}
            {horrorMovies.length > 0 && (
              <MovieRow
                title="Terrifying Thrillers"
                movies={horrorMovies}
                onMovieClick={handleMovieClick}
                onDownload={downloadMovie}
                onToggleFavorite={toggleFavorite}
                favorites={favorites}
                downloadedIds={downloadedIds}
                downloadingIds={downloadingIds}
                downloadingProgress={downloadingProgress}
              />
            )}
            {animationMovies.length > 0 && (
              <MovieRow
                title="Animation Station"
                movies={animationMovies}
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
              title="Upcoming"
              movies={upcomingMovies.filter(
                (movie) =>
                  movie.releaseDate &&
                  new Date(movie.releaseDate) > new Date()
              )}
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
  );
};
