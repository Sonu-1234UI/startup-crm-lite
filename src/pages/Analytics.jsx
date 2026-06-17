// Import React library
import React from 'react';

// Define the Analytics functional component
const Analytics = () => {
  // Return the JSX to render
  return (
    // Main container with full height, background color, padding, text color
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      {/* Heading for the Analytics page */}
      <h1 className="text-3xl font-bold mb-4">Analytics</h1>
      {/* Paragraph providing some content for the page */}
      <p className="text-lg">View your startup's growth and metrics here.</p>
    </div>
  );
};

// Export the component as default for lazy loading
export default Analytics;
