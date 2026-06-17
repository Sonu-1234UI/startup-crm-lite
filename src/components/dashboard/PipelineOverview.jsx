import React from 'react';

/**
 * Displays a visual horizontal bar representing the pipeline status of leads.
 * 
 * @param {Object} props
 * @param {Array<Object>} props.leads - Array of lead objects.
 * @returns {JSX.Element}
 */
const PipelineOverview = ({ leads }) => {
  const totalLeads = leads.length;
  
  if (totalLeads === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Pipeline Overview</h3>
        <p className="text-slate-500 text-sm">No leads in pipeline.</p>
      </div>
    );
  }

  // Count leads by status
  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  // Define status colors and order
  const statuses = [
    { key: 'New', color: 'bg-blue-500', label: 'New' },
    { key: 'Contacted', color: 'bg-amber-500', label: 'Contacted' },
    { key: 'Qualified', color: 'bg-green-500', label: 'Qualified' },
    { key: 'Lost', color: 'bg-red-500', label: 'Lost' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Pipeline Overview</h3>
      
      {/* Horizontal Bar */}
      <div className="h-4 flex rounded-full overflow-hidden mb-6">
        {statuses.map(status => {
          const count = statusCounts[status.key] || 0;
          const percentage = (count / totalLeads) * 100;
          return percentage > 0 ? (
            <div 
              key={status.key} 
              className={`h-full ${status.color}`} 
              style={{ width: `${percentage}%` }}
              title={`${status.label}: ${count} (${percentage.toFixed(1)}%)`}
            ></div>
          ) : null;
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statuses.map(status => {
          const count = statusCounts[status.key] || 0;
          return (
            <div key={status.key} className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
              <div>
                <p className="text-xs text-slate-500 font-medium">{status.label}</p>
                <p className="text-sm font-semibold text-slate-800">{count}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineOverview;
