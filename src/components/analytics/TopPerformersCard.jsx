import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { formatCurrency } from '../../utils/analyticsHelpers';

/**
 * Displays top performing sales reps ranked by Won revenue.
 * Features a podium-style layout with medal indicators.
 */
const TopPerformersCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Top Performers</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return {
          badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
          ring: 'ring-2 ring-amber-200 dark:ring-amber-700',
          icon: '🥇',
        };
      case 2:
        return {
          badge: 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300',
          ring: 'ring-2 ring-slate-200 dark:ring-gray-600',
          icon: '🥈',
        };
      case 3:
        return {
          badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
          ring: 'ring-2 ring-orange-200 dark:ring-orange-700',
          icon: '🥉',
        };
      default:
        return {
          badge: 'bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400',
          ring: '',
          icon: `#${rank}`,
        };
    }
  };

  // Calculate total won revenue for progress bars
  const maxRevenue = data[0]?.revenue || 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Top Performers</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Sales reps ranked by won revenue</p>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      <div className="space-y-3">
        {data.slice(0, 5).map((performer) => {
          const style = getRankStyle(performer.rank);
          const widthPercent = (performer.revenue / maxRevenue) * 100;

          return (
            <div
              key={performer.name}
              className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-gray-900/30 hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors duration-200 ${style.ring}`}
            >
              {/* Rank indicator */}
              <span className="text-lg flex-shrink-0 w-8 text-center">{style.icon}</span>

              {/* Name and details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {performer.name}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex-shrink-0 ml-2">
                    {formatCurrency(performer.revenue)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">
                  {performer.deals} {performer.deals === 1 ? 'deal' : 'deals'} closed
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TopPerformersCard);
