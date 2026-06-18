import React from 'react';
import { TrendingUp, TrendingDown, Sparkles, Shield } from 'lucide-react';
import { formatCurrency } from '../../utils/analyticsHelpers';

/**
 * Revenue forecast card showing predicted next-month revenue
 * based on the average of the last 6 months with trend adjustment.
 */
const ForecastCard = ({ data }) => {
  if (!data) return null;

  const { predicted, confidence, trend } = data;
  const trendIsPositive = trend > 0;

  /**
   * Returns a ring color based on confidence level.
   */
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'text-green-500 dark:text-green-400';
    if (conf >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getConfidenceLabel = (conf) => {
    if (conf >= 80) return 'High';
    if (conf >= 60) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Revenue Forecast</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Predicted next month</p>
        </div>
        <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30">
          <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
      </div>

      {/* Predicted Revenue */}
      <div className="mb-5">
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {formatCurrency(predicted)}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          {trendIsPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-semibold ${trendIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {trendIsPositive ? '+' : ''}{trend}%
          </span>
          <span className="text-xs text-slate-400 dark:text-gray-500">growth trend</span>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${getConfidenceColor(confidence)}`} />
            <span className="text-sm text-slate-600 dark:text-gray-400">Confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
              {confidence}%
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              confidence >= 80 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : confidence >= 60 
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {getConfidenceLabel(confidence)}
            </span>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-3 h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              confidence >= 80 ? 'bg-green-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      <p className="text-[10px] text-slate-400 dark:text-gray-600 text-center mt-3">
        Based on 6-month rolling average with trend adjustment
      </p>
    </div>
  );
};

export default React.memo(ForecastCard);
