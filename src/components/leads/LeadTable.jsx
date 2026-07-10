import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

const LeadTable = ({ leads, onEdit, onDelete }) => {
  const formatCurrency = (v) => v ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v) : '—';

  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-8 text-center text-slate-500 dark:text-gray-400">
        No leads found. Add a new lead to get started.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
          <thead className="bg-slate-50 dark:bg-gray-900/50">
            <tr>
              {['Name', 'Company', 'Status', 'Contact', 'Source', 'Value', 'Date', 'Actions'].map(h => (
                <th key={h} scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-slate-200 dark:divide-gray-700">
            {leads.map((lead) => (
              // Use _id (MongoDB) with fallback to id for legacy sample data
              <tr key={lead._id || lead.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{lead.name}</div>
                  {lead.owner && <div className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{lead.owner}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">{lead.company}</td>
                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={lead.status} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                  <div className="flex flex-col">
                    <a href={`mailto:${lead.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[180px]">{lead.email}</a>
                    {lead.phone && <a href={`tel:${lead.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400 text-xs text-slate-400 dark:text-gray-500 mt-0.5">{lead.phone}</a>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">{lead.source}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-gray-300">{formatCurrency(lead.value)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                  {new Date(lead.createdAt || lead.dateAdded).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-1">
                    <button onClick={() => onEdit(lead)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      aria-label={`Edit ${lead.name}`}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(lead._id || lead.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      aria-label={`Delete ${lead.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTable;
