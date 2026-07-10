/**
 * @file src/components/AppShell.jsx
 * @description Conditional layout wrapper.
 *
 * On auth pages (/login, /register) the sidebar and mobile header are hidden
 * so those pages render as full-screen standalone forms.
 *
 * On all other routes (/, /leads, /analytics) the standard app shell
 * (sidebar + main) is rendered.
 *
 * This approach avoids creating two separate Router layouts and keeps the
 * existing Sidebar and MobileHeader components unchanged.
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

/** Routes that should render without the app chrome (sidebar, header). */
const AUTH_PATHS = ['/login', '/register'];

/**
 * @param {{ children: React.ReactNode }} props
 */
const AppShell = ({ children }) => {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  // ── Auth pages: no shell, render children directly ──────────────────
  if (isAuthPage) {
    return <>{children}</>;
  }

  // ── App pages: standard sidebar + main layout ────────────────────────
  return (
    <div className="min-h-screen bg-gray-200 dark:bg-black transition-colors duration-200 flex justify-center">
      {/* Centered container — same as the original App.jsx layout */}
      <div className="w-full max-w-[1440px] flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 shadow-2xl relative overflow-hidden">
        <MobileHeader />
        <Sidebar />
        {/* pb-16 pads for the mobile bottom nav so content isn't hidden behind it */}
        <main className="flex-grow h-[calc(100vh-3.5rem)] md:h-screen overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
