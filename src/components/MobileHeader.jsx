import React from 'react';
import { BarChart3 } from 'lucide-react';
import DarkModeToggle from './common/DarkModeToggle';

/**
 * Mobile-only top header.
 * Shown only on screens smaller than md (768px).
 */
const MobileHeader = () => {
  return (
    <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <BarChart3 className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">Startup CRM</p>
        </div>
      </div>
      <div>
        <DarkModeToggle />
      </div>
    </header>
  );
};

export default MobileHeader;
