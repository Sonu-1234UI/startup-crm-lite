/**
 * @file src/context/AuthContext.jsx
 * @description Global authentication state and actions for Startup CRM Lite.
 *
 * Provides:
 *   - `user`      : The authenticated User object (or null if logged out).
 *   - `token`     : The JWT string (or null if not logged in).
 *   - `isLoading` : True while the app is verifying a saved token on mount.
 *   - `login(email, password)`       : Authenticates and sets state + token.
 *   - `register(name, email, password)` : Creates account and auto-logs in.
 *   - `logout()`                     : Clears state, token, and redirects.
 *
 * Session restoration:
 *   On mount, if 'crm-token' exists in localStorage, the context calls
 *   getProfile() to validate it server-side. This means a valid session
 *   survives a page refresh without showing the login screen.
 *
 * Usage:
 *   Wrap your app with <AuthProvider>.
 *   In any component: const { user, login, logout } = useAuth();
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  login  as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getProfile,
  getToken,
  getCachedUser,
} from '../services/authService.js';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * The AuthContext itself. Components consume this via `useAuth()`.
 */
export const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------

/**
 * Provides authentication state to the entire component tree.
 * Must be placed inside <BrowserRouter> so it can call `useNavigate`.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  // ── State ──────────────────────────────────────────────────────────────
  const [user,      setUser]      = useState(null);
  const [token,     setToken]     = useState(getToken);        // lazy init from localStorage
  const [isLoading, setIsLoading] = useState(true);            // true until session is verified

  const navigate = useNavigate();

  // ── Session restoration on mount ──────────────────────────────────────
  useEffect(() => {
    /**
     * If a token exists in localStorage, validate it by calling GET /api/auth/me.
     * On success: populate user state so protected routes render normally.
     * On failure: the 401 handler in api.js clears the token and redirects.
     */
    const restoreSession = async () => {
      const savedToken = getToken();

      if (!savedToken) {
        // No token in storage — user is definitely logged out.
        setIsLoading(false);
        return;
      }

      try {
        // The api.js interceptor will attach the saved token automatically.
        const result = await getProfile();

        if (result?.data) {
          setUser(result.data);
          setToken(savedToken);
        }
      } catch (error) {
        // Token was invalid/expired — api.js interceptor already cleared it
        // and redirected. Just reset local state to be safe.
        setUser(null);
        setToken(null);
      } finally {
        // Always turn off the loading gate regardless of outcome.
        setIsLoading(false);
      }
    };

    restoreSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only.

  // ── login ──────────────────────────────────────────────────────────────

  /**
   * Authenticates the user with email + password.
   *
   * On success:
   *   - Saves the token to localStorage (done inside authService.login).
   *   - Updates user + token state.
   *   - Navigates to the dashboard.
   *   - Shows a success toast.
   *
   * On failure:
   *   - Throws the error so the Login page can display the API error message.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  const login = useCallback(async (email, password) => {
    // authService.login() saves token to localStorage internally.
    const result = await apiLogin(email, password);

    const { token: newToken, user: newUser } = result.data;

    // Update React state so ProtectedRoute re-renders immediately.
    setToken(newToken);
    setUser(newUser);

    toast.success(`Welcome back, ${newUser.name}! 👋`);
    navigate('/');
  }, [navigate]);

  // ── register ───────────────────────────────────────────────────────────

  /**
   * Creates a new user account and automatically logs them in.
   *
   * The backend returns a token on successful registration — we treat this
   * the same as a login so the user lands on the dashboard immediately.
   *
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  const register = useCallback(async (name, email, password) => {
    const result = await apiRegister(name, email, password);

    const { token: newToken, user: newUser } = result.data;

    // Persist token — authService.register() doesn't save it automatically
    // (only login does), so we save it here.
    localStorage.setItem('crm-token', newToken);
    localStorage.setItem('crm-user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    toast.success(`Account created! Welcome to CRM, ${newUser.name}! 🎉`);
    navigate('/');
  }, [navigate]);

  // ── logout ─────────────────────────────────────────────────────────────

  /**
   * Signs the user out by:
   *   1. Calling authService.logout() to clear localStorage.
   *   2. Resetting React state.
   *   3. Navigating to the /login page.
   *
   * @returns {void}
   */
  const logout = useCallback(() => {
    apiLogout();          // clears localStorage
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully.');
    navigate('/login');
  }, [navigate]);

  // ── Context value ──────────────────────────────────────────────────────

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// useAuth — custom hook
// ---------------------------------------------------------------------------

/**
 * Custom hook for consuming AuthContext.
 * Must be used inside a component that is a descendant of <AuthProvider>.
 *
 * @returns {{ user, token, isLoading, isAuthenticated, login, register, logout }}
 *
 * @example
 * const { user, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }

  return context;
};
