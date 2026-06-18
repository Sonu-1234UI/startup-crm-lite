import React from 'react';

const PipelineOverview = ({ leads }) => {
  const totalLeads = leads.length;

  if (totalLeads === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Pipeline Overview</h3>
        <p className="text-slate-500 dark:text-gray-400 text-sm">No leads in pipeline.</p>
      </div>
    );
  }

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const statuses = [
    { key: 'New', color: 'bg-slate-400', label: 'New' },
    { key: 'Contacted', color: 'bg-blue-500', label: 'Contacted' },
    { key: 'Meeting Scheduled', color: 'bg-amber-500', label: 'Meeting' },
    { key: 'Proposal Sent', color: 'bg-purple-500', label: 'Proposal' },
    { key: 'Won', color: 'bg-green-500', label: 'Won' },
    { key: 'Lost', color: 'bg-red-500', label: 'Lost' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Pipeline Overview</h3>

      {/* Horizontal Bar */}
      <div className="h-4 flex rounded-full overflow-hidden mb-6 gap-0.5">
        {statuses.map(status => {
          const count = statusCounts[status.key] || 0;
          const percentage = (count / totalLeads) * 100;
          return percentage > 0 ? (
            <div
              key={status.key}
              className={`h-full ${status.color} first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${percentage}%` }}
              title={`${status.label}: ${count} (${percentage.toFixed(1)}%)`}
            />
          ) : null;
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statuses.map(status => {
          const count = statusCounts[status.key] || 0;
          return (
            <div key={status.key} className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${status.color}`} />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">{status.label}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{count}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineOverview;
