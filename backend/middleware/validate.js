/**
 * @file middleware/validate.js
 * @description express-validator runner middleware factory.
 *
 * Usage:
 *   Pass an array of express-validator chain objects to `validate()` and
 *   place the result between the validation rules and the route handler:
 *
 *     router.post(
 *       '/register',
 *       registerValidation,   // array of check() chains
 *       validate,             // this middleware — runs chains & checks errors
 *       register              // controller — only reached if valid
 *     );
 *
 * Why a single middleware instead of per-route boilerplate?
 *   - DRY: validation error formatting lives in exactly one place.
 *   - Consistent: every 400 response has the same { success, errors } shape.
 *   - Testable: the factory and the logic are independently unit-testable.
 */

import { validationResult } from 'express-validator';

// ---------------------------------------------------------------------------
// validate — middleware that collects express-validator errors
// ---------------------------------------------------------------------------

/**
 * Express middleware that inspects the result of preceding express-validator
 * `check()` chains and returns a formatted 400 response if any fail.
 *
 * The error objects in the response follow the same shape used by the global
 * errorHandler for Mongoose ValidationErrors so the frontend has one unified
 * error format to handle:
 *   { field: string, message: string }
 *
 * If validation passes, `next()` is called with no arguments and the request
 * continues to the route controller.
 *
 * @param {import('express').Request}      req  - Express request (populated by validator chains).
 * @param {import('express').Response}     res  - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 *
 * @example
 * // In a route file:
 * import validate from '../middleware/validate.js';
 * import { body } from 'express-validator';
 *
 * const rules = [
 *   body('email').isEmail().withMessage('Must be a valid email'),
 *   body('password').isLength({ min: 6 }).withMessage('Min 6 chars'),
 * ];
 *
 * router.post('/login', rules, validate, loginController);
 */
const validate = (req, res, next) => {
  // Collect all validation errors accumulated by preceding check() chains.
  const errors = validationResult(req);

  // If validation passed — hand off to the next middleware / controller.
  if (errors.isEmpty()) {
    return next();
  }

  // Map express-validator's error objects to our standard { field, message }
  // shape. `path` is the field name in express-validator v7+.
  const formattedErrors = errors.array().map((err) => ({
    field: err.path || err.param, // `path` (v7) with `param` (v6) fallback
    message: err.msg,
  }));

  // Return 400 — no need to call next(error) since this is an expected,
  // handled validation failure (not an unexpected server error).
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
  });
};

export default validate;
