/**
 * @file src/App.jsx
 * @description Root application component.
 *
 * Provider order (outermost → innermost):
 *   ThemeProvider    — dark/light mode (persisted in localStorage, no auth needed)
 *   BrowserRouter    — React Router (must wrap AuthProvider so useNavigate works)
 *   AuthProvider     — JWT session state + login/register/logout actions
 *   LeadProvider     — Lead CRUD state connected to the API
 *   Toaster          — react-hot-toast portal (must be inside BrowserRouter)
 *   AppRoutes        — route tree with ProtectedRoute guard
 *
 * Layout strategy:
 *   The Sidebar and MobileHeader are only shown on protected/app routes.
 *   The /login and /register pages render full-screen without the shell.
 *   AppRoutes handles this by rendering Login/Register outside the shell layout.
 *
 * Note: The app-shell <div> (sidebar + main) stays rendered for protected
 * routes. Login/Register render their own full-screen layout via their pages.
 * We use a simple approach: always render the shell, but Login/Register pages
 * use `min-h-screen` and cover the viewport independently.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext.jsx';
import { LeadProvider } from './context/LeadContext';
import AppShell from './components/AppShell.jsx';
import AppRoutes from './routes';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/*
          AuthProvider MUST be inside BrowserRouter because it calls
          useNavigate() internally (for post-login redirects).
        */}
        <AuthProvider>
          <LeadProvider>
            {/*
              Toaster renders toast notifications. Placed here so it is
              available on both public (login) and protected routes.
            */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg, #fff)',
                  color:      'var(--toast-color, #1e293b)',
                  fontSize:   '14px',
                  fontWeight: '500',
                },
                success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />

            {/*
              AppShell wraps the sidebar+main layout for app pages.
              Login/Register render full-screen and sit outside the shell.
            */}
            <AppShell>
              <AppRoutes />
            </AppShell>
          </LeadProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
