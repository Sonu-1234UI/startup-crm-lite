import React from 'react';
import { Edit2, Trash2, Mail, Phone, Building } from 'lucide-react';
import StatusBadge from './StatusBadge';

const LeadCard = ({ lead, onEdit, onDelete }) => {
  const formatCurrency = (v) => v ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">{lead.name}</h3>
          <div className="flex items-center text-slate-500 dark:text-gray-400 text-sm mt-1">
            <Building className="w-3.5 h-3.5 mr-1.5" />
            {lead.company}
          </div>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="space-y-2 py-3 border-y border-slate-100 dark:border-gray-700">
        <div className="flex items-center text-slate-600 dark:text-gray-300 text-sm">
          <Mail className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-gray-500 flex-shrink-0" />
          <a href={`mailto:${lead.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 truncate">{lead.email}</a>
        </div>
        {lead.phone && (
          <div className="flex items-center text-slate-600 dark:text-gray-300 text-sm">
            <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-gray-500 flex-shrink-0" />
            <a href={`tel:${lead.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">{lead.phone}</a>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex flex-col gap-1">
          {lead.value && <span className="text-slate-700 dark:text-gray-300 font-semibold">{formatCurrency(lead.value)}</span>}
          <span className="text-slate-400 dark:text-gray-500 text-xs">
            {new Date(lead.createdAt || lead.dateAdded).toLocaleDateString()}
          </span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(lead)}
            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            aria-label="Edit lead"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(lead.id)}
            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            aria-label="Delete lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
