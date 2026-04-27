export interface MovieBoxSearchResult {
  subjectId: string;
  detailPath: string;       // slug like "movie-inception-xxxxx" – needed for sources
  subjectType: number;      // 1 for movies, 2 for TV series
  title: string;
  year?: string | number;
  thumbnail?: string;
}

export interface MovieBoxSource {
  quality: number;
  streamUrl: string;
  downloadUrl: string;
  directUrl?: string;
  size?: number;
  format?: string;
}

const API_BASE_URL = import.meta.env.VITE_WORKER_URL || "/api";

export const movieboxService = {
  /**
   * Search for a movie or TV show by title to find its MovieBox ID + detailPath
   */
  async search(query: string): Promise<MovieBoxSearchResult[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.status === "success" && data.data?.items) {
        return data.data.items as MovieBoxSearchResult[];
      }
      return [];
    } catch (error) {
      console.error("MovieBox Search Error:", error);
      return [];
    }
  },

  /**
   * Get streaming proxy URLs for a MovieBox item.
   * Requires BOTH subjectId and detailPath from search results.
   */
  async getSources(
    subjectId: string,
    detailPath: string,
    season?: number,
    episode?: number
  ): Promise<MovieBoxSource[]> {
    try {
      let url = `${API_BASE_URL}/sources?subjectId=${encodeURIComponent(subjectId)}&detailPath=${encodeURIComponent(detailPath)}`;
      if (season !== undefined && episode !== undefined) {
        url += `&season=${season}&episode=${episode}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "success" && data.data?.processedSources) {
        return data.data.processedSources as MovieBoxSource[];
      }
      return [];
    } catch (error) {
      console.error("MovieBox Sources Error:", error);
      return [];
    }
  }
};
