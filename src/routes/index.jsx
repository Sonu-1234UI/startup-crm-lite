// Import React library and lazy, Suspense for code splitting/lazy loading
import React, { lazy, Suspense } from 'react';
// Import Routes and Route components from react-router-dom v6
import { Routes, Route } from 'react-router-dom';

// Lazily load the Dashboard page component
const Dashboard = lazy(() => import('../pages/Dashboard'));
// Lazily load the Leads page component
const Leads = lazy(() => import('../pages/Leads'));
// Lazily load the Analytics page component
const Analytics = lazy(() => import('../pages/Analytics'));
// Lazily load the NotFound page component for 404 errors
const NotFound = lazy(() => import('../pages/NotFound'));

// Define the AppRoutes functional component to hold all route definitions
const AppRoutes = () => {
  // Return the JSX to render
  return (
    // Suspense wraps lazy components to show a fallback UI while they are loading
    <Suspense fallback={<div className="flex justify-center items-center h-screen text-xl text-gray-500">Loading...</div>}>
      {/* Routes component acts as a container for all Route definitions (v6 syntax) */}
      <Routes>
        {/* Route for the root path (Dashboard) */}
        <Route path="/" element={<Dashboard />} />
        {/* Route for the leads path (Lead Management) */}
        <Route path="/leads" element={<Leads />} />
        {/* Route for the analytics path (Analytics) */}
        <Route path="/analytics" element={<Analytics />} />
        {/* Catch-all route for any undefined paths, showing the NotFound component (404) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

// Export AppRoutes to be used in the main application file
export default AppRoutes;
