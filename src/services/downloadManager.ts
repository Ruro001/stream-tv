import { Media, DownloadState, DownloadStatus } from "../types";
import { storageService } from "./storageService";

type DownloadUpdateCallback = (state: DownloadState) => void;

class DownloadManager {
  private activeDownloads: Map<string, DownloadState> = new Map();
  private subscribers: Set<DownloadUpdateCallback> = new Set();
  private speedInterval: number = 1000; // update speed every second

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
    if (this.activeDownloads.has(mediaId)) return;

    const abortController = new AbortController();
    const initialState: DownloadState = {
      mediaId,
      movie,
      status: 'downloading',
      progress: 0,
      receivedBytes: 0,
      totalBytes: 0,
      speed: 0,
      abortController
    };

    // Check for existing partial download
    const partial = await storageService.getPartialVideo(mediaId);
    let startByte = 0;
    let initialChunks: Uint8Array[] = [];

    if (partial) {
      startByte = partial.blob.size;
      initialChunks = [new Uint8Array(await partial.blob.arrayBuffer())];
      initialState.receivedBytes = startByte;
      console.log(`Resuming download from ${startByte} bytes`);
    }

    this.activeDownloads.set(mediaId, initialState);
    this.notify(initialState);

    this.runDownloadLoop(mediaId, downloadUrl, movie, quality, startByte, initialChunks);
  }

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

    try {
      // Safety check: Ensure localhost uses http to avoid ERR_SSL_PROTOCOL_ERROR
      let finalUrl = downloadUrl;
      if (finalUrl.includes('https://localhost:5000') || finalUrl.includes('https://127.0.0.1:5000')) {
        finalUrl = finalUrl.replace('https:', 'http:');
        console.log('[DownloadManager] Corrected protocol for localhost:', finalUrl);
      }

      const response = await fetch(finalUrl, {
        signal: state.abortController.signal,
        headers: startByte > 0 ? { 'Range': `bytes=${startByte}-` } : {}
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const totalBytes = (Number(response.headers.get('Content-Length')) || 0) + startByte;
      
      if (!reader) throw new Error("No reader available");

      state.totalBytes = totalBytes;
      let receivedBytes = startByte;
      let chunks = [...initialChunks];
      let lastUpdate = performance.now();
      let lastBytes = startByte;

      const speedIntervalId = setInterval(() => {
        const now = performance.now();
        const currentState = this.activeDownloads.get(mediaId);
        if (!currentState || currentState.status !== 'downloading') {
          clearInterval(speedIntervalId);
          return;
        }

        const deltaBytes = currentState.receivedBytes - lastBytes;
        const deltaTime = (now - lastUpdate) / 1000;
        currentState.speed = deltaBytes / deltaTime;
        
        lastBytes = currentState.receivedBytes;
        lastUpdate = now;
        this.notify({ ...currentState });
      }, this.speedInterval);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;
        
        state.receivedBytes = receivedBytes;
        state.progress = (receivedBytes / totalBytes) * 100;
        
        // Save partial every 5MB
        if (chunks.length % 50 === 0) {
          const blob = new Blob(chunks as BlobPart[], { type: 'video/mp4' });
          await storageService.savePartialVideo(mediaId, blob, movie, quality);
        }
      }

      clearInterval(speedIntervalId);
      
      const finalBlob = new Blob(chunks as BlobPart[], { type: 'video/mp4' });
      await storageService.saveVideo(mediaId, finalBlob, movie, quality);
      await storageService.deletePartialVideo(mediaId);

      state.status = 'completed';
      state.progress = 100;
      this.notify({ ...state });
      this.activeDownloads.delete(mediaId);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        state.status = 'paused';
        this.notify({ ...state });
      } else {
        console.error("Download manager error:", error);
        state.status = 'error';
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
