import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pause, Play, X, ArrowDown, ChevronUp, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { DownloadState, DownloadStatus } from '../types';
import { downloadManager } from '../services/downloadManager';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number) => {
  if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

export const DownloadTray = () => {
  const [activeDownloads, setActiveDownloads] = useState<DownloadState[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Initial load
    setActiveDownloads(downloadManager.getActiveDownloads());

    // Subscribe to updates
    const unsubscribe = downloadManager.subscribe((state) => {
      setActiveDownloads(current => {
        // If state is idle, remove it (finished cleaning)
        if (state.status === 'idle') {
          return current.filter(d => d.mediaId !== state.mediaId);
        }

        // Otherwise upsert
        const index = current.findIndex(d => d.mediaId === state.mediaId);
        if (index >= 0) {
          const next = [...current];
          next[index] = state;
          return next;
        } else {
          return [...current, state];
        }
      });
    });

    return () => unsubscribe();
  }, []);

  if (activeDownloads.length === 0) return null;

  return (
    <motion.div 
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[150] w-[95%] max-w-xl"
    >
      <div className="bg-[#1a1c22]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-prime-blue/20 flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-prime-blue animate-bounce" />
            </div>
            <p className="text-white font-bold text-sm">
              Downloads ({activeDownloads.length})
            </p>
          </div>
          <button className="text-gray-400">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        {/* List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="max-h-80 overflow-y-auto no-scrollbar"
            >
              {activeDownloads.map((item) => (
                <div key={item.mediaId} className="p-4 border-b border-white/5 last:border-0 group">
                  <div className="flex items-start gap-4">
                    <img 
                      src={item.movie.thumbnail} 
                      alt={item.movie.title} 
                      className="w-12 aspect-[2/3] object-cover rounded-md shadow-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="text-white font-bold text-sm truncate">{item.movie.title}</h4>
                        <div className="flex items-center gap-2">
                          {item.status === 'downloading' && (
                            <button 
                              onClick={() => downloadManager.pauseDownload(item.mediaId)}
                              className="text-gray-400 hover:text-white transition-colors p-1"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          {(item.status === 'paused' || item.status === 'error') && (
                            <button 
                              onClick={() => {}} // In a real app we'd trigger resume with original source
                              className="text-prime-blue hover:text-blue-400 transition-colors p-1"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => downloadManager.cancelDownload(item.mediaId)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Status Info */}
                      <div className="flex justify-between items-center text-[10px] text-gray-400 mb-2 font-medium">
                        <div className="flex gap-3">
                          {item.status === 'downloading' && (
                            <>
                              <span>{formatSpeed(item.speed)}</span>
                              <span>{item.progress}%</span>
                            </>
                          )}
                          {item.status === 'paused' && <span className="text-yellow-500">Paused</span>}
                          {item.status === 'completed' && <span className="text-green-500 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Finished</span>}
                          {item.status === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error</span>}
                        </div>
                        {item.totalBytes > 0 && (
                          <span>
                            {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${
                            item.status === 'error' ? 'bg-red-500' : 
                            item.status === 'completed' ? 'bg-green-500' : 'bg-prime-blue'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
