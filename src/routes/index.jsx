/**
 * @file src/routes/index.jsx
 * @description Application routing with authentication protection.
 *
 * Route structure:
 *   Public (no token required):
 *     /login    → <Login />
 *     /register → <Register />
 *
 *   Protected (valid JWT required — enforced by <ProtectedRoute>):
 *     /          → <Dashboard />
 *     /leads     → <Leads />
 *     /analytics → <Analytics />
 *
 *   Catch-all:
 *     /*         → <NotFound />
 *
 * ProtectedRoute behaviour:
 *   - While AuthContext is verifying the saved token (isLoading = true):
 *     Shows a full-screen loading spinner so the page doesn't flash to /login.
 *   - If no token: redirects to /login (preserving the attempted URL in `state`
 *     so we can redirect back after a successful login, if needed).
 *   - If token present: renders <Outlet /> (the matched child route).
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

// ── Lazy-loaded page components ───────────────────────────────────────────
// Code-splitting keeps the initial bundle small; each page loads on first visit.
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Leads      = lazy(() => import('../pages/Leads'));
const Analytics  = lazy(() => import('../pages/Analytics'));
const NotFound   = lazy(() => import('../pages/NotFound'));
const Login      = lazy(() => import('../pages/Login'));
const Register   = lazy(() => import('../pages/Register'));

// ---------------------------------------------------------------------------
// Suspense fallback — shown while any lazy component is being fetched
// ---------------------------------------------------------------------------

/**
 * Full-screen loading indicator used as the Suspense fallback.
 * Matches the app's theme so the transition is seamless.
 */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-sm text-slate-400 dark:text-gray-500">Loading…</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------

/**
 * A route guard that checks for an authenticated session.
 *
 * Flow:
 *   1. While AuthContext is still verifying the token → show <PageLoader />.
 *   2. No token (user is logged out) → redirect to /login.
 *   3. Token present (user is logged in) → render <Outlet /> (child routes).
 *
 * The `replace` prop on <Navigate> prevents the login page from being pushed
 * to browser history so the back button behaves correctly.
 *
 * @returns {JSX.Element}
 */
const ProtectedRoute = () => {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  // Show a spinner while the auth context is restoring the session.
  // Without this guard, users who have a valid saved token would briefly
  // see a flash of the login page on every page refresh.
  if (isLoading) {
    return <PageLoader />;
  }

  // No token → redirect to login, passing the current path so we can
  // return here after successful authentication (optional enhancement).
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated → render the matched child route.
  return <Outlet />;
};

// ---------------------------------------------------------------------------
// AppRoutes — the top-level router
// ---------------------------------------------------------------------------

/**
 * Defines the complete route tree for the application.
 * Wrapped in <Suspense> so all lazy-loaded pages have a consistent fallback.
 *
 * @returns {JSX.Element}
 */
const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── Protected routes — all wrapped inside ProtectedRoute ──────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/leads"     element={<Leads />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      {/* ── 404 catch-all ─────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
