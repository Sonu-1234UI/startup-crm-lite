// Import React library
import React from 'react';
// Import BrowserRouter from react-router-dom to enable routing functionality
import { BrowserRouter } from 'react-router-dom';
// Import the Sidebar component to be displayed on the left side
import Sidebar from './components/Sidebar';
// Import the centralized route definitions
import AppRoutes from './routes';

// Define the main App functional component
function App() {
  // Return the JSX to render
  return (
    // Wrap the entire application in BrowserRouter to provide routing context
    <BrowserRouter>
      {/* Main container for the application layout, using flex for a sidebar layout */}
      <div className="min-h-screen flex bg-gray-50">
        {/* Render the Sidebar component which will be visible on the left across all routes */}
        <Sidebar />
        {/* Main content area that will expand to fill remaining horizontal space */}
        <main className="flex-grow h-screen overflow-y-auto">
          {/* Render the route definitions which determine what component to show based on the URL */}
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}

// Export the App component as the default export
export default App;
