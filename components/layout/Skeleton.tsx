import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-white/5 rounded-2xl ${className}`}
      {...props}
    >
      {/* Optional shimmer highlight */}
      <div 
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" 
      />
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="relative overflow-hidden bg-white/5 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      {/* Tags Skeleton */}
      <div className="flex gap-2 pt-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-4 pt-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CommunitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 h-64 flex flex-col justify-end gap-4 overflow-hidden relative">
        <div className="flex gap-6 items-end">
          <Skeleton className="w-24 h-24 md:w-28 md:h-28 rounded-3xl shrink-0" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
