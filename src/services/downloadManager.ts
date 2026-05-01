import { Media, DownloadState, DownloadStatus } from "../types";
import { storageService } from "./storageService";

type DownloadUpdateCallback = (state: DownloadState) => void;

class DownloadManager {
  private activeDownloads: Map<string, DownloadState> = new Map();
  private subscribers: Set<DownloadUpdateCallback> = new Set();

  subscribe(callback: DownloadUpdateCallback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(state: DownloadState) {
    this.subscribers.forEach(cb => cb(state));
  }

  getActiveDownloads(): DownloadState[] {
    return Array.from(this.activeDownloads.values());
  }

  async startDownload(movie: Media, downloadUrl: string, quality: string) {
    const mediaId = movie.id;
    const existing = this.activeDownloads.get(mediaId);
    
    if (existing && existing.status === 'downloading') return;

    const abortController = new AbortController();
    
    const state: DownloadState = existing ? {
      ...existing,
      status: 'downloading',
      abortController
    } : {
      mediaId,
      movie,
      status: 'downloading',
      progress: 0,
      receivedBytes: 0,
      totalBytes: 0,
      speed: 0,
      abortController
    };

    const partial = await storageService.getPartialVideo(mediaId);
    let startByte = 0;
    let initialChunks: Uint8Array[] = [];

    if (partial) {
      startByte = partial.blob.size;
      initialChunks = [new Uint8Array(await partial.blob.arrayBuffer())];
      state.receivedBytes = startByte;
      console.log(`[DownloadManager] Resuming from ${Math.round(startByte / 1024 / 1024)}MB`);
    }

    this.activeDownloads.set(mediaId, state);
    this.notify(state);

    this.runDownloadLoop(mediaId, downloadUrl, movie, quality, startByte, initialChunks);
  }

  // Flush threshold: save partial to disk every 10MB to prevent RAM buildup
  private static FLUSH_THRESHOLD = 10 * 1024 * 1024; // 10MB

  private async runDownloadLoop(
    mediaId: string, 
    downloadUrl: string, 
    movie: Media, 
    quality: string,
    startByte: number,
    initialChunks: Uint8Array[]
  ) {
    const state = this.activeDownloads.get(mediaId);
    if (!state || !state.abortController) return;

    let speedIntervalId: any;
    // Only keep a small buffer of chunks in RAM; periodically flush to disk
    let chunks: Uint8Array[] = [...initialChunks];
    let unflushedBytes = 0;

    try {
      let finalUrl = downloadUrl;
      if (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1')) {
        finalUrl = finalUrl.replace('https:', 'http:');
      }

      const response = await fetch(finalUrl, {
        signal: state.abortController.signal,
        headers: startByte > 0 ? { 'Range': `bytes=${startByte}-` } : {}
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const contentLen = Number(response.headers.get('Content-Length')) || 0;
      const totalBytes = contentLen + startByte;
      
      if (!reader) throw new Error("No reader available");

      state.totalBytes = totalBytes;
      let receivedBytes = startByte;
      let lastBytes = startByte;
      let lastUpdate = performance.now();

      speedIntervalId = setInterval(() => {
        const now = performance.now();
        const cur = this.activeDownloads.get(mediaId);
        if (!cur || cur.status !== 'downloading') {
          clearInterval(speedIntervalId);
          return;
        }

        const deltaBytes = cur.receivedBytes - lastBytes;
        const deltaTime = (now - lastUpdate) / 1000;
        if (deltaTime > 0) {
          cur.speed = deltaBytes / deltaTime;
        }
        
        lastBytes = cur.receivedBytes;
        lastUpdate = now;
        this.notify({ ...cur });
      }, 1000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;
        unflushedBytes += value.length;
        
        state.receivedBytes = receivedBytes;
        state.progress = totalBytes > 0 ? (receivedBytes / totalBytes) * 100 : 0;
        
        // Flush chunks to disk every 10MB to keep RAM usage low
        if (unflushedBytes >= DownloadManager.FLUSH_THRESHOLD) {
          try {
            const partialBlob = new Blob(chunks as BlobPart[], { type: 'video/mp4' });
            await storageService.savePartialVideo(mediaId, partialBlob, movie, quality);
            // Clear in-memory chunks after successful flush
            chunks = [];
            unflushedBytes = 0;
          } catch (e) {
            console.warn("[DownloadManager] Periodic flush failed, keeping in memory:", e);
          }
        }
      }

      clearInterval(speedIntervalId);
      
      // Build the final blob: read any previously flushed partial + remaining in-memory chunks
      let finalBlob: Blob;
      if (chunks.length === 0) {
        // Everything was flushed to disk already
        const partial = await storageService.getPartialVideo(mediaId);
        finalBlob = partial ? partial.blob : new Blob([], { type: 'video/mp4' });
      } else {
        // Combine flushed partial (if any) with remaining in-memory chunks
        const partial = await storageService.getPartialVideo(mediaId);
        const parts = partial ? [partial.blob as BlobPart, ...(chunks as BlobPart[])] : (chunks as BlobPart[]);
        finalBlob = new Blob(parts, { type: 'video/mp4' });
      }

      await storageService.saveVideo(mediaId, finalBlob, movie, quality);
      await storageService.deletePartialVideo(mediaId);
      // Free memory
      chunks = [];

      state.status = 'completed';
      state.progress = 100;
      state.speed = 0;
      this.notify({ ...state });
      this.activeDownloads.delete(mediaId);

    } catch (error: any) {
      if (speedIntervalId) clearInterval(speedIntervalId);
      
      if (error.name === 'AbortError') {
        // Save remaining in-memory chunks to partial on pause/abort
        try {
           if (chunks.length > 0) {
             const partial = await storageService.getPartialVideo(mediaId);
             const parts = partial ? [partial.blob as BlobPart, ...(chunks as BlobPart[])] : (chunks as BlobPart[]);
             const blob = new Blob(parts, { type: 'video/mp4' });
             await storageService.savePartialVideo(mediaId, blob, movie, quality);
           }
        } catch (e) {
           console.error("Failed to save partial download state:", e);
        }
        chunks = [];
        
        state.status = 'paused';
        state.speed = 0;
        this.notify({ ...state });
      } else {
        console.error("Download manager error:", error);
        // Still try to save progress on error so it can be resumed
        try {
          if (chunks.length > 0) {
            const partial = await storageService.getPartialVideo(mediaId);
            const parts = partial ? [partial.blob as BlobPart, ...(chunks as BlobPart[])] : (chunks as BlobPart[]);
            const blob = new Blob(parts, { type: 'video/mp4' });
            await storageService.savePartialVideo(mediaId, blob, movie, quality);
          }
        } catch (_) { /* ignore */ }
        chunks = [];

        state.status = 'error';
        state.speed = 0;
        this.notify({ ...state });
      }
    }
  }

  async pauseDownload(mediaId: string) {
    const state = this.activeDownloads.get(mediaId);
    if (state && state.abortController) {
      state.abortController.abort();
    }
  }

  async resumeDownload(mediaId: string, streamUrl: string) {
    const state = this.activeDownloads.get(mediaId);
    if (state && (state.status === 'paused' || state.status === 'error')) {
      // Re-trigger startDownload which will handle the partial logic
      this.startDownload(state.movie, streamUrl, 'unknown');
    }
  }

  async cancelDownload(mediaId: string) {
    const state = this.activeDownloads.get(mediaId);
    if (state && state.abortController) {
      state.abortController.abort();
    }
    this.activeDownloads.delete(mediaId);
    await storageService.deletePartialVideo(mediaId);
    this.notify({ mediaId, movie: null as any, status: 'idle', progress: 0, receivedBytes: 0, totalBytes: 0, speed: 0 });
  }
}

export const downloadManager = new DownloadManager();
