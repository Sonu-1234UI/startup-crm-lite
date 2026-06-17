import React from 'react';
import { UserPlus, Users, Download } from 'lucide-react';

/**
 * Provides quick action buttons for common tasks.
 * 
 * @returns {JSX.Element}
 */
const QuickActions = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button className="w-full flex items-center justify-start space-x-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm">
          <UserPlus className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>
        <button className="w-full flex items-center justify-start space-x-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors font-medium text-sm">
          <Users className="w-4 h-4 text-slate-500" />
          <span>View All Leads</span>
        </button>
        <button className="w-full flex items-center justify-start space-x-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors font-medium text-sm">
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Data</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
