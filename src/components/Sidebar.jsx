// Import React library
import React from 'react';
// Import NavLink from react-router-dom for navigation with active state styling
import { NavLink } from 'react-router-dom';

// Define the Sidebar functional component
const Sidebar = () => {
  // Define a helper function to determine the classes for each navigation link based on its active state
  // It receives an object with an isActive boolean property from NavLink
  const getNavLinkClass = ({ isActive }) => {
    // Base classes applied to all links, now block-level for a vertical list
    const baseClasses = "block px-4 py-3 rounded-md transition-colors duration-200 font-medium mb-2 ";
    // If active, apply highlighting styles (blue background and text). If not, apply hover styles.
    return baseClasses + (isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900");
  };

  // Return the JSX to render
  return (
    // Aside element serving as the semantic container for the sidebar, with fixed width and full height
    <aside className="w-64 bg-white shadow-lg flex flex-col sticky top-0 h-screen">
      {/* Container for branding/logo text */}
      <div className="p-6 border-b border-gray-100">
        <div className="text-2xl font-bold text-gray-800">
          {/* Startup CRM Lite title */}
          Startup CRM
        </div>
      </div>
      
      {/* Container for the navigation links using flexbox for vertical layout */}
      <div className="flex-grow flex flex-col p-4">
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
      
      {/* Optional bottom section for settings or user profile could go here */}
      <div className="p-4 border-t border-gray-100 text-sm text-gray-500 text-center">
        v1.0 Lite
      </div>
    </aside>
  );
};

// Export the Sidebar component
export default Sidebar;
