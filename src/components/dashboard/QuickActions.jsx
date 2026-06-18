import React from 'react';
import { UserPlus, Users, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button
          onClick={() => navigate('/leads')}
          className="w-full flex items-center justify-start space-x-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>
        <button
          onClick={() => navigate('/leads')}
          className="w-full flex items-center justify-start space-x-3 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600 rounded-lg transition-colors font-medium text-sm"
        >
          <Users className="w-4 h-4 text-slate-500 dark:text-gray-400" />
          <span>View All Leads</span>
        </button>
        <button
          className="w-full flex items-center justify-start space-x-3 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600 rounded-lg transition-colors font-medium text-sm"
        >
          <Download className="w-4 h-4 text-slate-500 dark:text-gray-400" />
          <span>Export Data</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
