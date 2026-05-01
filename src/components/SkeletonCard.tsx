import { motion } from "motion/react";

/**
 * Shimmering skeleton placeholder that matches MovieCard dimensions.
 * Used while data is loading to give a premium feel.
 */
export const SkeletonCard = () => (
  <div className="flex-none w-[120px] md:w-[180px]">
    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/5">
      {/* Shimmer animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      {/* Fake badge area */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <div className="w-10 h-3 bg-white/10 rounded" />
      </div>
      {/* Fake title area */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
        <div className="w-3/4 h-3 bg-white/10 rounded" />
        <div className="w-1/2 h-2.5 bg-white/8 rounded" />
      </div>
    </div>
  </div>
);

/** A full skeleton row matching MovieRow layout */
export const SkeletonRow = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-3 py-4">
    {/* Title skeleton */}
    <div className="px-4">
      <div className="w-40 h-5 bg-white/10 rounded" />
    </div>
    {/* Cards skeleton */}
    <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

/** Hero section skeleton */
export const SkeletonHero = () => (
  <div className="relative w-full h-[60vh] md:h-[70vh] flex flex-col justify-end pb-8">
    <div className="absolute inset-0 -z-10 overflow-hidden bg-white/5">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-[#1f232b] via-[#1f232b]/50 to-transparent" />
    <div className="px-6 w-full max-w-4xl mx-auto space-y-3 relative z-10">
      <div className="w-32 h-5 bg-white/10 rounded" />
      <div className="w-64 h-10 bg-white/10 rounded" />
      <div className="w-20 h-3 bg-white/8 rounded" />
    </div>
  </div>
);
