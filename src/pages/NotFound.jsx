// Import React library
import React from 'react';
// Import Link component to allow navigation back to home
import { Link } from 'react-router-dom';

// Define the NotFound functional component
const NotFound = () => {
  // Return the JSX to render
  return (
    // Centered container with full height and flexbox
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      {/* Large 404 text indicating the error */}
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      {/* Explanatory text for the user */}
      <p className="text-2xl mb-8">Page Not Found</p>
      {/* Link acting as a button to navigate back to the Dashboard */}
      <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
        {/* Text inside the link */}
        Return to Dashboard
      </Link>
    </div>
  );
};

// Export the component as default for lazy loading
export default NotFound;
