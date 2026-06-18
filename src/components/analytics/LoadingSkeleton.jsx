import React from 'react';

/**
 * Skeleton loading component that mimics the analytics dashboard layout.
 * Uses pulse animation for smooth loading feedback.
 */
const SkeletonCard = ({ className = '', height = 'h-32' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 animate-pulse ${className}`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-24 mb-3" />
        <div className="h-7 bg-slate-200 dark:bg-gray-700 rounded w-32" />
      </div>
      <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-xl" />
    </div>
    <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-20 mt-4" />
  </div>
);

const SkeletonChart = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 animate-pulse ${className}`}>
    <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-40 mb-2" />
    <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-56 mb-6" />
    <div className="space-y-3">
      <div className="flex items-end space-x-2 h-48">
        {[40, 65, 45, 80, 55, 70].map((h, i) => (
          <div key={i} className="flex-1 bg-slate-200 dark:bg-gray-700 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-8" />
        ))}
      </div>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded w-64 mb-2" />
      <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-96" />
    </div>

    {/* Filters */}
    <div className="h-12 bg-slate-200 dark:bg-gray-700 rounded-xl w-96 animate-pulse" />

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>

    {/* Charts Row 1 */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>

    {/* Charts Row 2 */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
  </div>
);

export default React.memo(LoadingSkeleton);
