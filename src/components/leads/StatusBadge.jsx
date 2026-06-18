import React from 'react';

/**
 * Pill-shaped colored badge showing the lead's status. Dark mode aware.
 */
const StatusBadge = ({ status }) => {
  const getBadgeStyle = (s) => {
    switch (s) {
      case 'New': return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600';
      case 'Contacted': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'Meeting Scheduled': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
      case 'Proposal Sent': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'Won': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'Lost': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600';
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getBadgeStyle(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
