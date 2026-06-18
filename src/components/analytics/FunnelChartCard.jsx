import React from 'react';
import { ArrowDown } from 'lucide-react';

/**
 * Sales funnel visualization showing conversion through each stage.
 * Uses custom bars with proportional widths instead of Recharts FunnelChart
 * for better visual control and dark mode compatibility.
 */
const FunnelChartCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Sales Funnel</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Sales Funnel</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Conversion through each pipeline stage</p>
      </div>

      <div className="space-y-1">
        {data.map((stage, index) => {
          const widthPercent = Math.max(15, (stage.value / maxValue) * 100);
          return (
            <div key={stage.name}>
              <div className="flex items-center gap-3">
                {/* Stage bar */}
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="h-12 rounded-lg flex items-center justify-between px-4 transition-all duration-500 relative overflow-hidden group cursor-default"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: stage.fill,
                      margin: '0 auto',
                    }}
                  >
                    <span className="text-white text-sm font-semibold relative z-10">{stage.name}</span>
                    <span className="text-white/90 text-sm font-bold relative z-10">{stage.value}</span>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
                  </div>
                </div>

                {/* Percentage */}
                <div className="w-20 text-right flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    {stage.percentage}%
                  </span>
                </div>
              </div>

              {/* Drop-off indicator between stages */}
              {index < data.length - 1 && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <ArrowDown className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                  {data[index + 1].dropOff !== undefined && data[index + 1].dropOff > 0 && (
                    <span className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                      -{data[index + 1].dropOff} ({data[index + 1].dropOffPercent}% drop)
                    </span>
                  )}
                  {data[index + 1].conversionFromPrev !== undefined && (
                    <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                      {data[index + 1].conversionFromPrev}% converted
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(FunnelChartCard);
