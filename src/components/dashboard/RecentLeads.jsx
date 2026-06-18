import React from 'react';

const RecentLeads = ({ leads }) => {
  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const getStatusBadge = (status) => {
    const map = {
      'New': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
      'Contacted': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      'Meeting Scheduled': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      'Proposal Sent': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
      'Won': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      'Lost': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${map[status] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Leads</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-700">
              <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">Date Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
            {recentLeads.length > 0 ? recentLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">{lead.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">{lead.company}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(lead.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                  {new Date(lead.createdAt || lead.dateAdded).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500 dark:text-gray-400">No recent leads found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentLeads;
