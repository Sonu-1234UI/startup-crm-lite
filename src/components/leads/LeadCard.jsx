import React from 'react';
import { Edit2, Trash2, Mail, Phone, Building } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * Card view for a single lead, primarily for mobile layouts.
 *
 * @param {Object} props
 * @param {Object} props.lead - The lead data object.
 * @param {Function} props.onEdit - Callback when edit is clicked.
 * @param {Function} props.onDelete - Callback when delete is clicked.
 * @returns {JSX.Element}
 */
const LeadCard = ({ lead, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{lead.name}</h3>
          <div className="flex items-center text-slate-500 text-sm mt-1">
            <Building className="w-4 h-4 mr-1.5" />
            {lead.company}
          </div>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="space-y-2 py-3 border-y border-slate-100">
        <div className="flex items-center text-slate-600 text-sm">
          <Mail className="w-4 h-4 mr-2 text-slate-400" />
          <a href={`mailto:${lead.email}`} className="hover:text-blue-600 truncate">{lead.email}</a>
        </div>
        {lead.phone && (
          <div className="flex items-center text-slate-600 text-sm">
            <Phone className="w-4 h-4 mr-2 text-slate-400" />
            <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">Added: {new Date(lead.dateAdded).toLocaleDateString()}</span>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(lead)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Edit lead"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(lead.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
