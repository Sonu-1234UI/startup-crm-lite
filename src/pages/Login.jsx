/**
 * @file src/pages/Login.jsx
 * @description Login page for Startup CRM Lite.
 *
 * Features:
 *   - Email + password form with client-side validation.
 *   - Calls useAuth().login() which saves the token and redirects to /.
 *   - Shows an inline error banner for API errors (invalid credentials, etc.).
 *   - Displays a loading spinner on the submit button during the request.
 *   - Link to /register for new users.
 *   - Styled to match the app's dark/light theme (Tailwind CSS).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [errors,   setErrors]     = useState({});
  const [apiError, setApiError]   = useState('');       // server-side error message
  const [showPwd,  setShowPwd]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field-level error and the API error banner on any change.
    if (errors[name])  setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError)      setApiError('');
  };

  /** Client-side validation before the network request. */
  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim())    newErrors.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                                   newErrors.email    = 'Enter a valid email address.';
    if (!formData.password)        newErrors.password = 'Password is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      // AuthContext.login() saves the token, updates state, and navigates to /.
      await login(formData.email, formData.password);
    } catch (error) {
      // Extract the API error message to display to the user.
      const serverMsg = error?.response?.data?.message;
      const errList   = error?.response?.data?.errors;

      if (errList?.length) {
        setApiError(errList.map(e => e.message).join(' '));
      } else {
        setApiError(serverMsg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reusable class helpers ────────────────────────────────────────────

  const inputBase = (hasError) =>
    `mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm
     bg-white dark:bg-gray-800
     text-slate-900 dark:text-white
     placeholder-slate-400 dark:placeholder-gray-500
     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
     transition-colors
     ${hasError
       ? 'border-red-400 dark:border-red-500'
       : 'border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500'
     }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">
            Sign in to your Startup CRM account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-8">

          {/* API Error Banner */}
          {apiError && (
            <div className="mb-5 flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className={inputBase(!!errors.email)}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={inputBase(!!errors.password)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600
                         px-4 py-2.5 text-sm font-semibold text-white shadow-sm
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:ring-offset-2 dark:focus:ring-offset-gray-800
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 dark:text-gray-600 mt-6">
          Startup CRM Lite · v1.0
        </p>
      </div>
    </div>
  );
};

export default Login;
