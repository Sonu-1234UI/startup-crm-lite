/**
 * @file src/services/authService.js
 * @description Authentication service — wraps all /api/auth endpoints.
 *
 * All functions return `response.data` (the unwrapped Axios response body)
 * which matches the shape: { success, message, data }
 *
 * Token management:
 *   - login()  saves the token to localStorage under 'crm-token'.
 *   - logout() removes it.
 *   - The api.js interceptor reads 'crm-token' on every request automatically.
 *
 * The backend auth routes (authRoutes.js) are mounted at /api/auth.
 */

import api from './api.js';

// The localStorage key used across the entire app for the JWT.
const TOKEN_KEY = 'crm-token';
// Optional: cache the user object so we can hydrate on page reload without an
// extra API round-trip in simple cases. AuthContext still validates via getProfile.
const USER_KEY  = 'crm-user';

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

/**
 * Creates a new user account.
 *
 * @param {string} name     - Display name for the new user.
 * @param {string} email    - Email address (must be unique).
 * @param {string} password - Plain-text password (hashed by the server).
 *
 * @returns {Promise<{success: boolean, message: string, data: {token: string, user: object}}>}
 *   On success the backend returns a JWT + user object.
 *   AuthContext.register() will save the token after this call.
 *
 * @throws {AxiosError} The Axios response interceptor re-throws on 4xx/5xx.
 */
export const register = async (name, email, password) => {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
};

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

/**
 * Authenticates an existing user and returns a JWT.
 *
 * Saves the token to localStorage so the Axios request interceptor can attach
 * it automatically to every subsequent request.
 *
 * @param {string} email    - Registered email address.
 * @param {string} password - Plain-text password.
 *
 * @returns {Promise<{success: boolean, message: string, data: {token: string, user: object}}>}
 *
 * @throws {AxiosError} 401 if credentials are invalid; 400 if validation fails.
 */
export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });

  // Persist the token so the interceptor can use it going forward.
  if (response.data?.data?.token) {
    localStorage.setItem(TOKEN_KEY, response.data.data.token);
    // Also cache the user object so AuthContext can restore it cheaply.
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
  }

  return response.data;
};

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

/**
 * Signs the current user out.
 *
 * The backend is stateless (JWT-based), so we only need to remove the token
 * from localStorage. Once removed, the Axios interceptor will stop sending the
 * Authorization header, and any future request to a protected endpoint will
 * receive a 401.
 *
 * @returns {void}
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------

/**
 * Fetches the authenticated user's profile from the server.
 *
 * Used by AuthContext on mount to restore a session from a saved token without
 * requiring the user to log in again. If the token is expired or invalid the
 * server returns 401, the response interceptor clears the token and redirects
 * to /login.
 *
 * @returns {Promise<{success: boolean, message: string, data: object}>}
 *   `data` is the User document (without password).
 *
 * @throws {AxiosError} 401 if the token is missing/invalid/expired.
 */
export const getProfile = async () => {
  // The route is GET /api/auth/me (the backend uses /me not /profile)
  const response = await api.get('/api/auth/me');
  return response.data;
};

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

/**
 * Updates the authenticated user's profile fields.
 *
 * @param {object} data           - Fields to update.
 * @param {string} [data.name]    - New display name.
 * @param {string} [data.currentPassword] - Required when changing password.
 * @param {string} [data.newPassword]     - The desired new password.
 *
 * @returns {Promise<{success: boolean, message: string, data: object}>}
 *   `data` is the updated User document.
 */
export const updateProfile = async (data) => {
  const response = await api.patch('/api/auth/me', data);
  return response.data;
};

// ---------------------------------------------------------------------------
// Helpers — convenient token / user accessors used by AuthContext
// ---------------------------------------------------------------------------

/**
 * Returns the raw JWT string from localStorage, or null if not logged in.
 * @returns {string|null}
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Returns the cached user object from localStorage, or null.
 * AuthContext validates this against the server via getProfile().
 * @returns {object|null}
 */
export const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
