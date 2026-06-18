// Import React library
import React from 'react';
// Import NavLink from react-router-dom for navigation with active state styling
import { NavLink } from 'react-router-dom';
import DarkModeToggle from './common/DarkModeToggle';

// Define the Navbar functional component
const Navbar = () => {
  // Define a helper function to determine the classes for each navigation link based on its active state
  // It receives an object with an isActive boolean property from NavLink
  const getNavLinkClass = ({ isActive }) => {
    // Base classes applied to all links
    const baseClasses = "px-4 py-2 rounded-md transition-colors duration-200 font-medium ";
    // If active, apply highlighting styles (blue background and text). If not, apply hover styles.
    return baseClasses + (isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100");
  };

  // Return the JSX to render
  return (
    // Nav element serving as the semantic container for navigation links, with styling for a top bar
    <nav className="bg-white dark:bg-gray-900 shadow-md p-4 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
      {/* Container to align items and set max width */}
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Branding/Logo text */}
        <div className="text-xl font-bold text-gray-800 dark:text-white">
          {/* Startup CRM Lite title */}
          Startup CRM
        </div>
        {/* Container for the navigation links using flexbox for horizontal layout */}
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {/* NavLink for the Dashboard route (/) */}
            <NavLink to="/" className={getNavLinkClass}>
              {/* Text for the Dashboard link */}
              Dashboard
            </NavLink>
            {/* NavLink for the Lead Management route (/leads) */}
            <NavLink to="/leads" className={getNavLinkClass}>
              {/* Text for the Leads link */}
              Leads
            </NavLink>
            {/* NavLink for the Analytics route (/analytics) */}
            <NavLink to="/analytics" className={getNavLinkClass}>
              {/* Text for the Analytics link */}
              Analytics
            </NavLink>
          </div>
          
          <div className="border-l border-gray-200 dark:border-gray-700 pl-4 flex items-center">
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

// Export the Navbar component to be used in App.jsx or other layouts
export default Navbar;
