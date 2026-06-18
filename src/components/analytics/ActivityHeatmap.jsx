import React, { useMemo } from 'react';

/**
 * GitHub-style activity heatmap showing daily lead activity.
 * Tracks leads created, meetings scheduled, and calls logged.
 */
const ActivityHeatmap = ({ data }) => {
  // Calculate intensity levels
  const maxCount = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const getColor = (count) => {
    if (count === 0) return 'bg-slate-100 dark:bg-gray-700';
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 'bg-green-200 dark:bg-green-900/40';
    if (ratio <= 0.5) return 'bg-green-400 dark:bg-green-700/60';
    if (ratio <= 0.75) return 'bg-green-500 dark:bg-green-600';
    return 'bg-green-600 dark:bg-green-500';
  };

  // Group by week
  const weeks = useMemo(() => {
    if (!data || data.length === 0) return [];
    const weekMap = {};
    data.forEach((cell) => {
      if (!weekMap[cell.week]) weekMap[cell.week] = [];
      weekMap[cell.week].push(cell);
    });
    return Object.values(weekMap);
  }, [data]);

  // Month labels
  const monthLabels = useMemo(() => {
    if (!data || data.length === 0) return [];
    const labels = [];
    let lastMonth = -1;
    data.forEach((cell) => {
      const d = new Date(cell.date);
      const month = d.getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: d.toLocaleString('default', { month: 'short' }),
          week: cell.week,
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [data]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Activity Heatmap</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Activity Heatmap</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Daily CRM activity over the last 6 months</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Month labels */}
          <div className="flex ml-8 mb-1">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-[11px] text-slate-400 dark:text-gray-500"
                style={{
                  position: 'relative',
                  left: `${(label.week / (weeks.length || 1)) * 100}%`,
                  marginRight: '-20px',
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 flex-shrink-0">
              {dayLabels.map((label, i) => (
                <div key={i} className="h-3 w-6 text-[10px] text-slate-400 dark:text-gray-500 flex items-center">
                  {label}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                  const cell = week.find((c) => c.day === dayIdx);
                  if (!cell) {
                    return <div key={dayIdx} className="w-3 h-3 rounded-sm" />;
                  }
                  return (
                    <div
                      key={dayIdx}
                      className={`w-3 h-3 rounded-sm ${getColor(cell.count)} cursor-default hover:ring-1 hover:ring-slate-400 dark:hover:ring-gray-500 transition-all duration-100`}
                      title={`${cell.date}: ${cell.count} ${cell.count === 1 ? 'activity' : 'activities'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[10px] text-slate-400 dark:text-gray-500">Less</span>
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-gray-700" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/60" />
            <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
            <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
            <span className="text-[10px] text-slate-400 dark:text-gray-500">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ActivityHeatmap);
