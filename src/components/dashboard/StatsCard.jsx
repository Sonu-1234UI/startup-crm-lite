import React from 'react';

/**
 * A card component to display a statistical metric.
 * Supports dark mode via Tailwind dark: classes.
 */
const StatsCard = ({ title, value, icon: Icon, change, color }) => {
  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : isNegative ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-gray-400'}`}>
            {change}
          </span>
          <span className="text-slate-500 dark:text-gray-500 ml-2">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
