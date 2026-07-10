/**
 * @file controllers/authController.js
 * @description Authentication business logic for Startup CRM Lite.
 *
 * Exported route handlers:
 *   register      — POST /api/auth/register
 *   login         — POST /api/auth/login
 *   getProfile    — GET  /api/auth/me       (protected)
 *   updateProfile — PATCH /api/auth/me      (protected)
 *
 * Exported helper:
 *   generateToken(userId) — signs and returns a JWT string
 *
 * Security principles applied:
 *  - Passwords NEVER appear in any response (User.toJSON() strips them;
 *    we also explicitly .select('-password') where needed).
 *  - Login errors use a single "Invalid credentials" message whether the
 *    email is unknown or the password is wrong — prevents user enumeration.
 *  - Deactivated accounts get a distinct 403 so admins can diagnose issues
 *    without exposing whether the account exists to an attacker.
 *  - All async operations wrapped in try/catch → next(error) so the global
 *    errorHandler formats every unexpected failure consistently.
 *
 * PRODUCTION NOTE — Rate Limiting:
 *   Add express-rate-limit on the /register and /login routes in authRoutes.js
 *   to mitigate brute-force and credential-stuffing attacks. Example:
 *
 *     import rateLimit from 'express-rate-limit';
 *     const authLimiter = rateLimit({
 *       windowMs: 15 * 60 * 1000,  // 15 minutes
 *       max: 10,                    // 10 attempts per window per IP
 *       message: 'Too many attempts, please try again later.',
 *     });
 *     router.post('/login', authLimiter, loginValidation, validate, login);
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// Helper: generateToken
// ---------------------------------------------------------------------------

/**
 * Signs a new JWT for the given user ID.
 *
 * The payload only contains the user's `_id` (as `id`) to keep tokens small
 * and avoid embedding stale data (role changes, etc. are always re-read from
 * the DB on each request via the `protect` middleware).
 *
 * Expiry is driven by `JWT_EXPIRES_IN` in `.env` (e.g. '7d', '1h') so it
 * can be changed per environment without a code deploy.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId - The user's MongoDB _id.
 * @returns {string} Signed JWT string.
 *
 * @example
 * const token = generateToken(user._id);
 * // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ---------------------------------------------------------------------------
// register — POST /api/auth/register
// ---------------------------------------------------------------------------

/**
 * Creates a new user account and returns a JWT.
 *
 * Flow:
 *  1. Check if the email is already registered → 409 Conflict if so.
 *  2. Create the User document (pre-save hook hashes the password).
 *  3. Sign a JWT with the new user's _id.
 *  4. Return 201 with the token and sanitised user object.
 *
 * @type {import('express').RequestHandler}
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ── Duplicate email check ─────────────────────────────────────────────
    // MongoDB's unique index would also catch this, but checking first gives
    // us a cleaner 409 with a user-friendly message rather than a raw
    // MongoServerError that the global handler has to normalise.
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'Email already exists', 409);
    }

    // ── Create user ───────────────────────────────────────────────────────
    // The pre-save hook on the User model hashes `password` before writing.
    const user = await User.create({ name, email, password });

    // ── Generate JWT ──────────────────────────────────────────────────────
    const token = generateToken(user._id);

    // ── Respond ───────────────────────────────────────────────────────────
    // user.toJSON() strips the password field (see User model override).
    return successResponse(
      res,
      { token, user },
      'Account created successfully',
      201
    );
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// login — POST /api/auth/login
// ---------------------------------------------------------------------------

/**
 * Authenticates an existing user and returns a JWT.
 *
 * Flow:
 *  1. Find the user by email, explicitly selecting the password hash.
 *  2. If not found OR password doesn't match → 401 "Invalid credentials".
 *     (Single message regardless of which condition failed — prevents
 *      user-enumeration attacks.)
 *  3. If account is deactivated → 403 "Account is deactivated".
 *  4. Sign and return a fresh JWT.
 *
 * @type {import('express').RequestHandler}
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Fetch user WITH password ──────────────────────────────────────────
    // The User schema has `password` selected by default; we still use
    // `.select('+password')` here as explicit documentation of intent and
    // as a safety net if the schema ever changes to `select: false`.
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // ── Validate credentials ──────────────────────────────────────────────
    // Use a single branch for "user not found" and "wrong password" to
    // prevent timing and user-enumeration attacks. comparePassword always
    // runs (no short-circuit) when user exists; when user is null we return
    // the same error before any comparison.
    const passwordMatch = user ? await user.comparePassword(password) : false;

    if (!user || !passwordMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // ── Check account status ──────────────────────────────────────────────
    if (!user.isActive) {
      return errorResponse(
        res,
        'Account is deactivated. Please contact support.',
        403
      );
    }

    // ── Generate JWT ──────────────────────────────────────────────────────
    const token = generateToken(user._id);

    // ── Respond ───────────────────────────────────────────────────────────
    // user.toJSON() strips the password field.
    return successResponse(res, { token, user }, 'Login successful');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// getProfile — GET /api/auth/me  (protected)
// ---------------------------------------------------------------------------

/**
 * Returns the currently authenticated user's profile.
 *
 * The `protect` middleware has already fetched and attached the user to
 * `req.user` (password excluded), so no additional DB query is needed.
 *
 * @type {import('express').RequestHandler}
 */
export const getProfile = async (req, res, next) => {
  try {
    // req.user is populated by the protect middleware with '-password' select.
    return successResponse(res, req.user, 'Profile fetched successfully');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// updateProfile — PATCH /api/auth/me  (protected)
// ---------------------------------------------------------------------------

/**
 * Updates the authenticated user's name and/or password.
 *
 * Rules:
 *  - Only `name` and `password` can be changed here.
 *  - Email changes are intentionally excluded: they require a
 *    verification email flow to confirm the new address is valid and owned.
 *  - Password changes require the current password to be supplied and
 *    verified first (prevents account takeover via XSS/stolen session).
 *
 * Flow:
 *  1. Fetch the full user document including password hash.
 *  2. If `name` provided → update it.
 *  3. If `newPassword` provided → verify `currentPassword` first, then update.
 *  4. Save (triggers pre-save hash if password changed), return updated user.
 *
 * @type {import('express').RequestHandler}
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    // Re-fetch user including password so we can verify currentPassword.
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // ── Name update ───────────────────────────────────────────────────────
    if (name !== undefined && name.trim() !== '') {
      user.name = name.trim();
    }

    // ── Password change ───────────────────────────────────────────────────
    if (newPassword) {
      // currentPassword is mandatory when changing password.
      if (!currentPassword) {
        return errorResponse(
          res,
          'Current password is required to set a new password',
          400
        );
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return errorResponse(res, 'Current password is incorrect', 401);
      }

      if (newPassword.length < 6) {
        return errorResponse(
          res,
          'New password must be at least 6 characters',
          400
        );
      }

      // Assign plain text — the pre-save hook will hash it on user.save().
      user.password = newPassword;
    }

    // ── Persist changes ───────────────────────────────────────────────────
    await user.save();

    // Re-fetch without password for the response to guarantee a clean object.
    const updatedUser = await User.findById(user._id).select('-password');

    return successResponse(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    return next(error);
  }
};
