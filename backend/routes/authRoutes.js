/**
 * @file routes/authRoutes.js
 * @description Express router for all authentication endpoints.
 *
 * Base path (mounted in server.js): /api/auth
 *
 * Public routes  (no token required):
 *   POST  /api/auth/register   — create account
 *   POST  /api/auth/login      — authenticate & receive JWT
 *
 * Protected routes (Bearer JWT required via `protect` middleware):
 *   GET   /api/auth/me         — fetch own profile
 *   PATCH /api/auth/me         — update name / password
 *
 * PRODUCTION NOTE — Rate Limiting:
 *   Uncomment the `authLimiter` block below and attach it to the /register
 *   and /login routes to defend against brute-force / credential-stuffing.
 *   Install first: npm i express-rate-limit
 *
 *   import rateLimit from 'express-rate-limit';
 *   const authLimiter = rateLimit({
 *     windowMs: 15 * 60 * 1000,  // 15-minute sliding window
 *     max: 10,                    // max 10 attempts per IP per window
 *     standardHeaders: true,      // Return `RateLimit-*` headers
 *     legacyHeaders: false,
 *     message: { success: false, message: 'Too many attempts. Try again later.' },
 *   });
 *   Then add `authLimiter` before `validate` in the /register and /login chains.
 */

import { Router } from 'express';
import { body } from 'express-validator';

import {
  register,
  login,
  getProfile,
  updateProfile,
} from '../controllers/authController.js';

import protect  from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

// ---------------------------------------------------------------------------
// Validation Rule Sets
// ---------------------------------------------------------------------------

/**
 * Validation chain for POST /register.
 *
 * Rules:
 *  - name     : required, 2–50 chars, trimmed
 *  - email    : required, valid email format, normalised to lowercase
 *  - password : required, minimum 6 characters
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

/**
 * Validation chain for POST /login.
 *
 * Rules:
 *  - email    : required, valid email format
 *  - password : required (length not re-validated here — wrong password
 *               gets a generic "Invalid credentials" from the controller)
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation chain for PATCH /me (updateProfile).
 *
 * All fields are optional — only validate what is present:
 *  - name        : if provided, 2–50 chars
 *  - newPassword : if provided, minimum 6 chars
 *  - currentPassword : required only when newPassword is supplied (checked in controller)
 */
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * Creates a new user account.
 * Public — no token required.
 *
 * Body: { name, email, password }
 * Returns: 201 { success, message, data: { token, user } }
 *
 * PRODUCTION: add authLimiter here ↓
 */
router.post('/register', registerValidation, validate, register);

/**
 * POST /api/auth/login
 * Authenticates an existing user and issues a JWT.
 * Public — no token required.
 *
 * Body: { email, password }
 * Returns: 200 { success, message, data: { token, user } }
 *
 * PRODUCTION: add authLimiter here ↓
 */
router.post('/login', loginValidation, validate, login);

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 * Protected — requires valid Bearer JWT.
 *
 * Returns: 200 { success, message, data: user }
 */
router.get('/me', protect, getProfile);

/**
 * PATCH /api/auth/me
 * Updates the authenticated user's name and/or password.
 * Protected — requires valid Bearer JWT.
 *
 * Body: { name?, currentPassword?, newPassword? }
 * Returns: 200 { success, message, data: updatedUser }
 */
router.patch('/me', protect, updateProfileValidation, validate, updateProfile);

export default router;
