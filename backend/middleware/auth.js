/**
 * @file middleware/auth.js
 * @description JWT authentication middleware — "protect" gate.
 *
 * Usage: place `protect` before any route handler that requires a logged-in user.
 *
 *   router.get('/me', protect, getProfile);
 *
 * Token flow:
 *   1. Client sends:  Authorization: Bearer <jwt>
 *   2. Middleware extracts, verifies, and decodes the token.
 *   3. User document is fetched from DB (password field excluded).
 *   4. User is attached to `req.user` for downstream handlers.
 *
 * All error paths return 401 / 403 via next(error) so the global
 * errorHandler in middleware/errorHandler.js handles the JSON response
 * consistently.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ---------------------------------------------------------------------------
// Helper — create a structured auth error with a status code
// ---------------------------------------------------------------------------

/**
 * Creates an Error with an attached HTTP status code.
 * Passing this to `next()` lets the global error handler format the response.
 *
 * @param {string} message    - Human-readable error message.
 * @param {number} statusCode - HTTP status code (401, 403, etc.).
 * @returns {Error}
 */
const authError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ---------------------------------------------------------------------------
// protect — main exported middleware
// ---------------------------------------------------------------------------

/**
 * Express middleware that authenticates a request via a Bearer JWT.
 *
 * Attaches the authenticated User document (minus password) to `req.user`
 * so every protected route handler can access it without another DB query.
 *
 * Error cases:
 *  - No / malformed header  → 401 "No token provided, access denied"
 *  - Tampered signature     → 401 "Token is invalid"
 *  - Past expiry date       → 401 "Token has expired, please login again"
 *  - User deleted from DB   → 401 "User belonging to this token no longer exists"
 *
 * @type {import('express').RequestHandler}
 */
const protect = async (req, _res, next) => {
  try {
    // ── Step 1: Extract token from Authorization header ──────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(authError('No token provided, access denied', 401));
    }

    // "Bearer <token>" → "<token>"
    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      return next(authError('No token provided, access denied', 401));
    }

    // ── Step 2: Verify + decode the JWT ──────────────────────────────────
    // jwt.verify() throws JsonWebTokenError or TokenExpiredError on failure;
    // those are caught below and mapped to the right messages.
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return next(authError('Token has expired, please login again', 401));
      }
      // JsonWebTokenError, NotBeforeError, etc.
      return next(authError('Token is invalid', 401));
    }

    // ── Step 3: Fetch user from database ─────────────────────────────────
    // Excluding password: even though toJSON() strips it, we avoid
    // fetching it entirely for defence-in-depth.
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      // Token was valid but the account was deleted after issuance.
      return next(
        authError('User belonging to this token no longer exists', 401)
      );
    }

    // ── Step 4: Attach user to request ───────────────────────────────────
    req.user = user;
    return next();
  } catch (error) {
    // Unexpected errors (DB down, etc.) propagate to the global handler.
    return next(error);
  }
};

export default protect;
