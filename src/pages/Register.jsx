/**
 * @file src/pages/Register.jsx
 * @description Registration page for Startup CRM Lite.
 *
 * Features:
 *   - Name, email, password, and confirm-password fields.
 *   - Client-side validation: passwords must match, min 6 chars, valid email.
 *   - Calls useAuth().register() which saves the token and redirects to /.
 *   - Shows an inline error banner for API errors.
 *   - Loading state on the submit button.
 *   - Password show/hide toggle on both password fields.
 *   - Link back to /login.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  // ── Form state ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors,   setErrors]     = useState({});
  const [apiError, setApiError]   = useState('');
  const [showPwd,  setShowPwd]    = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError)     setApiError('');
  };

  /** Client-side validation */
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim())
      newErrors.name = 'Name is required.';
    else if (formData.name.trim().length < 2)
      newErrors.name = 'Name must be at least 2 characters.';

    if (!formData.email.trim())
      newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Enter a valid email address.';

    if (!formData.password)
      newErrors.password = 'Password is required.';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters.';

    if (!formData.confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password.';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      await register(formData.name.trim(), formData.email, formData.password);
      // AuthContext.register() navigates to / on success.
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const errList   = error?.response?.data?.errors;

      if (errList?.length) {
        setApiError(errList.map(e => e.message).join(' '));
      } else {
        setApiError(serverMsg || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Password strength indicator ───────────────────────────────────────

  const pwdLength = formData.password.length;
  const pwdStrength =
    pwdLength === 0 ? null :
    pwdLength < 6   ? 'weak' :
    pwdLength < 10  ? 'fair' : 'strong';

  const strengthConfig = {
    weak:   { label: 'Weak',   color: 'bg-red-500',    width: 'w-1/3' },
    fair:   { label: 'Fair',   color: 'bg-amber-400',  width: 'w-2/3' },
    strong: { label: 'Strong', color: 'bg-green-500',  width: 'w-full' },
  };

  // ── Reusable class helpers ─────────────────────────────────────────────

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

  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-gray-300';
  const errorClass = 'mt-1 text-xs text-red-500 dark:text-red-400';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">
            Start managing your leads with Startup CRM
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

            {/* Name */}
            <div>
              <label htmlFor="reg-name" className={labelClass}>
                Full name
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className={inputBase(!!errors.name)}
                disabled={isSubmitting}
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className={labelClass}>
                Email address
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@startup.com"
                className={inputBase(!!errors.email)}
                disabled={isSubmitting}
              />
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
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
              {errors.password && <p className={errorClass}>{errors.password}</p>}

              {/* Strength Bar */}
              {pwdStrength && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300
                                  ${strengthConfig[pwdStrength].color}
                                  ${strengthConfig[pwdStrength].width}`}
                    />
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    pwdStrength === 'weak'   ? 'text-red-500' :
                    pwdStrength === 'fair'   ? 'text-amber-500' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {strengthConfig[pwdStrength].label} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className={labelClass}>
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showConf ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={inputBase(!!errors.confirmPassword)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showConf ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {/* Match checkmark */}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className={errorClass}>{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600
                         px-4 py-2.5 text-sm font-semibold text-white shadow-sm
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:ring-offset-2 dark:focus:ring-offset-gray-800
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all duration-200 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-gray-600 mt-6">
          Startup CRM Lite · v1.0
        </p>
      </div>
    </div>
  );
};

export default Register;
