import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LeadProvider } from './context/LeadContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import AppRoutes from './routes';

function App() {
  return (
    <ThemeProvider>
      <LeadProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <MobileHeader />
            <Sidebar />
            {/* pb-16 gives padding for the mobile bottom nav so content isn't hidden behind it */}
            <main className="flex-grow h-[calc(100vh-3.5rem)] md:h-screen overflow-y-auto pb-16 md:pb-0">
              <AppRoutes />
            </main>
          </div>
        </BrowserRouter>
      </LeadProvider>
    </ThemeProvider>
  );
}

export default App;
