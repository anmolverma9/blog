import React from 'react';

/**
 * Single shimmering line helper
 */
export function SkeletonLine({ className = 'h-4 w-full' }: { className?: string }) {
  return (
    <div className={`bg-slate-200 animate-pulse rounded-lg relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent ${className}`} />
  );
}

/**
 * Shimmer Card loader mimicking CardItem
 */
export function CardItemSkeleton() {
  return (
    <div className="bg-white border border-slate-100/90 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between h-[360px] p-5 space-y-4">
      <div className="aspect-video w-full rounded-2xl bg-slate-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex gap-2">
          <SkeletonLine className="h-3 w-16" />
          <SkeletonLine className="h-3 w-20" />
        </div>
        <SkeletonLine className="h-5 w-11/12" />
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-4/5" />
      </div>
      <div className="flex justify-between items-center border-t pt-3">
        <SkeletonLine className="h-3.5 w-24" />
        <SkeletonLine className="h-3.5 w-10" />
      </div>
    </div>
  );
}

/**
 * Full Grid listing skeleton loading page state
 */
export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Post detail page loading skeleton
 */
export function PostDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header shimmers */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <SkeletonLine className="h-3.5 w-16" />
          <SkeletonLine className="h-3.5 w-20" />
        </div>
        <SkeletonLine className="h-8 w-11/12 sm:h-10" />
        <div className="flex items-center gap-3 pt-2">
          <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
          <div className="space-y-1.5 flex-1">
            <SkeletonLine className="h-3.5 w-32" />
            <SkeletonLine className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Featured Cover shimmer */}
      <div className="aspect-video w-full rounded-3xl bg-slate-100 animate-pulse shadow-sm" />

      {/* Article content paragraph shimmers */}
      <div className="space-y-4 pt-4">
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-11/12" />
        <SkeletonLine className="h-4 w-4/5" />
        <div className="h-2" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-9/12" />
      </div>
    </div>
  );
}

/**
 * Sidebar Categories/Tags list shimmer
 */
export function SidebarShimmer() {
  return (
    <div className="space-y-4 border border-slate-100 bg-white p-5 rounded-2xl shadow-sm">
      <SkeletonLine className="h-4 w-28" />
      <div className="space-y-2 pt-2">
        <SkeletonLine className="h-8 w-full" />
        <SkeletonLine className="h-8 w-full" />
        <SkeletonLine className="h-8 w-full" />
        <SkeletonLine className="h-8 w-full" />
      </div>
    </div>
  );
}
