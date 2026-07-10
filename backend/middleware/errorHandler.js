/**
 * @file middleware/errorHandler.js
 * @description Global Express error-handling middleware.
 *
 * This MUST be registered LAST — after all routes — in server.js so that
 * errors bubbled up via `next(err)` from any route handler or middleware
 * flow through here.
 *
 * It normalises every error type the application can produce into a single,
 * consistent JSON shape using the `errorResponse` helper. Stack traces are
 * only included in development mode to avoid leaking internals in production.
 *
 * Handled error types:
 *  - Mongoose ValidationError    → 400 Bad Request
 *  - Mongoose CastError          → 404 Not Found (invalid ObjectId)
 *  - MongoDB Duplicate Key 11000 → 409 Conflict
 *  - JsonWebTokenError           → 401 Unauthorized
 *  - TokenExpiredError           → 401 Unauthorized
 *  - Everything else             → 500 Internal Server Error
 */

import { errorResponse } from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// Helper: extract Mongoose validation field errors
// ---------------------------------------------------------------------------

/**
 * Converts a Mongoose `ValidationError` into an array of field-level error
 * objects suitable for sending to the client.
 *
 * @param {import('mongoose').Error.ValidationError} err - The Mongoose error.
 * @returns {{ field: string, message: string }[]} Array of field errors.
 */
const extractValidationErrors = (err) =>
  Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------

/**
 * Express global error-handling middleware.
 *
 * Must declare exactly 4 parameters so Express recognises it as an error
 * handler and does not treat it as a regular route middleware.
 *
 * @param {Error}                      err  - The error object passed to `next(err)`.
 * @param {import('express').Request}  req  - Express request object.
 * @param {import('express').Response} res  - Express response object.
 * @param {import('express').NextFunction} next - Express next function (required by signature).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // ── Development-only diagnostics ──────────────────────────────────────────
  // Print every error to the server console with full stack trace so engineers
  // can debug without opening a browser. Never remove this log — it is gated
  // by NODE_ENV so it will not appear in production.
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 [ErrorHandler]', err);
  }

  // ── Determine whether to include a stack trace in the response ────────────
  // Stack traces are invaluable during development but must never be sent to
  // clients in production (security / information disclosure risk).
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  // ── 1. Mongoose ValidationError ───────────────────────────────────────────
  // Occurs when a document fails schema-level validation (required fields,
  // enum mismatches, regex validators, etc.).
  if (err.name === 'ValidationError') {
    const fieldErrors = extractValidationErrors(err);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: fieldErrors,
      ...(stack && { stack }),
    });
  }

  // ── 2. Mongoose CastError (invalid ObjectId) ──────────────────────────────
  // Triggered when a route parameter like `:id` cannot be cast to an
  // ObjectId (e.g. `/api/leads/not-an-id`). Treat it as a 404 because
  // no document with that malformed id can possibly exist.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      errors: null,
      ...(stack && { stack }),
    });
  }

  // ── 3. MongoDB Duplicate Key Error ────────────────────────────────────────
  // Error code 11000 is thrown by MongoDB when a unique-index constraint is
  // violated (most commonly on `email`). Return 409 Conflict.
  if (err.code === 11000) {
    // Extract the duplicated field name from the error keyValue map for a
    // more informative message (e.g. "email already exists").
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${duplicatedField.charAt(0).toUpperCase() + duplicatedField.slice(1)} already exists`,
      errors: null,
      ...(stack && { stack }),
    });
  }

  // ── 4. JWT — Invalid Token ────────────────────────────────────────────────
  // Thrown by `jsonwebtoken` when the token signature is invalid or the token
  // has been tampered with.
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
      errors: null,
      ...(stack && { stack }),
    });
  }

  // ── 5. JWT — Expired Token ────────────────────────────────────────────────
  // Thrown by `jsonwebtoken` when a valid token has passed its `exp` claim.
  // Return 401 with a distinct message so the frontend can prompt re-login.
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.',
      errors: null,
      ...(stack && { stack }),
    });
  }

  // ── 6. Catch-all — Unhandled / Unexpected Errors ─────────────────────────
  // Any error not matched above falls here. Use the status code set on the
  // error object by the thrower, falling back to 500.
  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500 ? 'Internal server error' : err.message || 'An error occurred';

  return res.status(statusCode).json({
    success: false,
    message,
    errors: null,
    ...(stack && { stack }),
  });
};

export default errorHandler;
