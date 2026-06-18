import React from 'react';
import { BarChart3, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Empty state shown when no leads data is available for analytics.
 * Provides a CTA to add the first lead.
 */
const EmptyAnalyticsState = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <BarChart3 className="w-10 h-10 text-slate-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
        No analytics available yet
      </h3>
      <p className="text-slate-500 dark:text-gray-400 text-center max-w-md mb-8">
        Add your first lead to start tracking business performance.
      </p>
      <button
        onClick={() => navigate('/leads')}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200"
      >
        <Plus className="w-5 h-5" />
        Add Lead
      </button>
    </div>
  );
};

export default React.memo(EmptyAnalyticsState);
