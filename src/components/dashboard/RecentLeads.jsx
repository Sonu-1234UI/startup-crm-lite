import React from 'react';

/**
 * Displays a table of the most recent leads.
 * 
 * @param {Object} props
 * @param {Array<Object>} props.leads - Array of lead objects.
 * @returns {JSX.Element}
 */
const RecentLeads = ({ leads }) => {
  // Get last 5 leads
  const recentLeads = leads.slice(0, 5);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">New</span>;
      case 'Contacted':
        return <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Contacted</span>;
      case 'Qualified':
        return <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Qualified</span>;
      case 'Lost':
        return <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Lost</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Recent Leads</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{lead.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{lead.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(lead.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(lead.dateAdded)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">
                  No recent leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentLeads;
