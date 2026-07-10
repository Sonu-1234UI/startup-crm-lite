/**
 * @file src/services/api.js
 * @description Central Axios instance for all API communication.
 *
 * This module creates a single, pre-configured Axios instance that every
 * service file imports instead of using raw `axios`. This gives us:
 *   - One place to set the base URL (from the Vite env variable).
 *   - Automatic JWT injection via a request interceptor.
 *   - Centralised 401 handling and network-error toasts via response interceptor.
 *
 * Token storage key: 'crm-token'  (must match authService.js)
 */

import axios from 'axios';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Create the Axios instance
// ---------------------------------------------------------------------------

/**
 * Pre-configured Axios instance.
 * baseURL is read from the Vite environment variable VITE_API_URL.
 * In development this is: http://localhost:5000 (set in .env)
 * In production this is overridden by the hosting platform's env variable.
 *
 * withCredentials: false — we use Bearer token auth, not cookies.
 * timeout: 15s — aborts stalled requests automatically.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor — attach JWT to every outgoing request
// ---------------------------------------------------------------------------

/**
 * Before every request is sent, this interceptor checks localStorage for a
 * saved JWT and, if found, appends it as a Bearer token in the Authorization
 * header. This means every service function automatically sends auth headers
 * without needing to manually build them.
 *
 * If no token is present (public routes), the header is simply omitted and
 * the server will handle the unauthenticated case.
 */
api.interceptors.request.use(
  (config) => {
    // Read the token fresh on every request — handles token refresh without
    // needing to restart the Axios instance.
    const token = localStorage.getItem('crm-token');

    if (token) {
      // Set the Authorization header in the standard Bearer scheme.
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Request configuration errors (very rare): propagate normally.
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Response Interceptor — handle 401 and network errors globally
// ---------------------------------------------------------------------------

/**
 * After every response is received, this interceptor:
 *   - On 401 Unauthorized: clears the stale/invalid token from localStorage
 *     and redirects the user to the /login page to re-authenticate.
 *   - On network error (no response at all): shows a toast notification
 *     explaining that the server cannot be reached.
 *   - All other errors are re-thrown so individual service callers can handle
 *     their own specific error cases (404, 422, 500, etc.).
 *
 * Why window.location.href instead of React Router's navigate?
 *   This interceptor lives outside of React's component tree, so we cannot
 *   use hooks. A hard redirect via window.location is the simplest correct
 *   approach — it also fully resets the React state tree, which is desirable
 *   after an auth failure.
 */
api.interceptors.response.use(
  // Successful responses (2xx): pass through untouched.
  (response) => response,

  (error) => {
    if (error.response) {
      // ── The server responded with an error status code ─────────────────

      if (error.response.status === 401) {
        // Token is missing, invalid, or expired.
        // Clear everything auth-related and send the user to login.
        localStorage.removeItem('crm-token');
        localStorage.removeItem('crm-user');

        // Avoid redirect loop if already on login/register pages.
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }

      // Let the individual caller handle all other status codes (400, 403, 404, 500…).
      return Promise.reject(error);
    }

    if (error.request) {
      // ── The request was sent but NO response was received ─────────────
      // This means the server is down, unreachable, or the user is offline.
      toast.error('Cannot connect to server. Check your connection.', {
        id: 'network-error', // dedupe: only one toast at a time
        duration: 5000,
      });
      return Promise.reject(error);
    }

    // ── Something else went wrong while setting up the request ──────────
    return Promise.reject(error);
  }
);

export default api;
