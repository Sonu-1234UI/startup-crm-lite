import React from 'react';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/analyticsHelpers';

/**
 * Sales Velocity widget showing the rate at which deals generate revenue.
 * Formula: (Opportunities × Win Rate × Avg Deal Size) / Sales Cycle Length
 */
const SalesVelocityCard = ({ data }) => {
  if (!data) return null;

  const { velocity, opportunities, winRate, avgDealSize, salesCycle } = data;

  const metrics = [
    { label: 'Opportunities', value: opportunities },
    { label: 'Win Rate', value: `${winRate}%` },
    { label: 'Avg Deal', value: formatCurrency(avgDealSize) },
    { label: 'Cycle', value: `${salesCycle}d` },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Sales Velocity</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Revenue generation rate</p>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      {/* Main velocity value */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(velocity)}
          </span>
          <span className="text-sm text-slate-500 dark:text-gray-400 font-medium">/day</span>
        </div>
      </div>

      {/* Formula breakdown */}
      <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-3">
        <div className="grid grid-cols-4 gap-2">
          {metrics.map((metric, index) => (
            <div key={metric.label} className="text-center">
              <p className="text-[11px] text-slate-400 dark:text-gray-500 mb-1">{metric.label}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{metric.value}</p>
              {index < metrics.length - 1 && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 dark:text-gray-600">×</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Formula label */}
      <p className="text-[10px] text-slate-400 dark:text-gray-600 text-center mt-3 font-mono">
        (Opp × WinRate × AvgDeal) ÷ CycleLen
      </p>
    </div>
  );
};

export default React.memo(SalesVelocityCard);
