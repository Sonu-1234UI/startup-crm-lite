import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, LayoutDashboard, Users } from 'lucide-react';
import DarkModeToggle from './common/DarkModeToggle';

const Sidebar = () => {
  const getNavLinkClass = ({ isActive }) => {
    // Mobile: vertical layout (icon top, text bottom). Tablet+: horizontal layout.
    const base = 'flex md:flex-row flex-col items-center gap-1 md:gap-3 px-2 py-2 md:px-4 md:py-2.5 md:rounded-xl font-medium text-[10px] md:text-sm transition-all duration-200 md:mb-1 w-full justify-center md:justify-start min-h-[44px] md:min-h-0 ';
    return base + (isActive
      ? 'text-blue-700 dark:text-blue-400 md:bg-blue-50 md:dark:bg-blue-900/30'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 md:hover:bg-gray-100 md:dark:hover:bg-gray-800'
    );
  };

  return (
    <>
      {/* Mobile: Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 pb-safe transition-colors duration-200">
        <div className="flex justify-around items-center px-2 py-1">
          <NavLink to="/" className={getNavLinkClass} end>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/leads" className={getNavLinkClass}>
            <Users className="w-5 h-5" />
            <span>Leads</span>
          </NavLink>
          <NavLink to="/analytics" className={getNavLinkClass}>
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </NavLink>
        </div>
      </nav>

      {/* Tablet/Desktop: Left Sidebar */}
      <aside className="hidden md:flex w-20 lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col sticky top-0 h-screen shadow-sm transition-all duration-300">
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-center lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="hidden lg:block">
              <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">Startup CRM</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Lite Edition</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow flex flex-col p-2 lg:p-4 mt-2">
          <p className="hidden lg:block text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-4 mb-2">Menu</p>
          <NavLink to="/" className={getNavLinkClass} end>
            <LayoutDashboard className="w-5 h-5 lg:w-4.5 lg:h-4.5" />
            <span className="hidden lg:inline">Dashboard</span>
          </NavLink>
          <NavLink to="/leads" className={getNavLinkClass}>
            <Users className="w-5 h-5 lg:w-4.5 lg:h-4.5" />
            <span className="hidden lg:inline">Leads</span>
          </NavLink>
          <NavLink to="/analytics" className={getNavLinkClass}>
            <BarChart3 className="w-5 h-5 lg:w-4.5 lg:h-4.5" />
            <span className="hidden lg:inline">Analytics</span>
          </NavLink>
        </nav>

        {/* Footer: Dark Mode Toggle */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center lg:items-stretch">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:px-2">
            <span className="hidden lg:inline text-sm text-gray-500 dark:text-gray-400 font-medium">Dark Mode</span>
            <DarkModeToggle />
          </div>
          <p className="hidden lg:block text-xs text-gray-400 dark:text-gray-600 text-center mt-3">v1.0 Lite</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
