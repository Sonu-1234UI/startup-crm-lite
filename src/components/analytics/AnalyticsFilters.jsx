import React from 'react';
import { Calendar } from 'lucide-react';

const RANGES = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

const AnalyticsFilters = ({ dateRange, setDateRange }) => {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-1.5 shadow-sm flex-wrap">
      <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500 ml-1.5 flex-shrink-0" />
      {RANGES.map(r => (
        <button
          key={r.value}
          onClick={() => setDateRange(r.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            dateRange === r.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-800 dark:hover:text-gray-200'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
};

export default AnalyticsFilters;
