/**
 * @file utils/apiResponse.js
 * @description Centralised helpers for building consistent HTTP JSON responses.
 *
 * Every endpoint in the application MUST use one of these functions instead of
 * calling `res.json()` directly. This guarantees:
 *  - A uniform response envelope across the entire API.
 *  - Predictable field names that the frontend can rely on.
 *  - A single place to add cross-cutting concerns (logging, tracing, etc.).
 *
 * Response envelope shape:
 *  Success  → { success: true,  message, data }
 *  Error    → { success: false, message, errors }
 *  Paginated→ { success: true,  data, pagination: { total, page, limit, pages } }
 */

// ---------------------------------------------------------------------------
// successResponse
// ---------------------------------------------------------------------------

/**
 * Sends a successful JSON response.
 *
 * Use this for any operation that completes without error:
 * GET (single/list), POST (create), PATCH/PUT (update), DELETE (soft-delete).
 *
 * @param {import('express').Response} res         - Express response object.
 * @param {*}                          data        - The payload to return (object, array, or null).
 * @param {string}                     [message='Success'] - Human-readable success message.
 * @param {number}                     [statusCode=200]    - HTTP status code (200, 201, etc.).
 * @returns {import('express').Response} The Express response (allows chaining).
 *
 * @example
 * // In a controller:
 * return successResponse(res, user, 'User fetched successfully');
 * // → 200 { success: true, message: 'User fetched successfully', data: { ...user } }
 *
 * @example
 * // For a 201 Created response:
 * return successResponse(res, newLead, 'Lead created', 201);
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// ---------------------------------------------------------------------------
// errorResponse
// ---------------------------------------------------------------------------

/**
 * Sends an error JSON response.
 *
 * Use this from controllers when you need to return a *known* error (e.g.
 * 400 validation, 401 unauthenticated, 403 forbidden, 404 not found).
 * Unknown/unexpected errors should be passed to `next(err)` so the global
 * error handler in `middleware/errorHandler.js` can process them.
 *
 * @param {import('express').Response} res               - Express response object.
 * @param {string}                     message           - Human-readable error description.
 * @param {number}                     [statusCode=500]  - HTTP status code.
 * @param {Object|Array|null}          [errors=null]     - Optional field-level error details.
 * @returns {import('express').Response} The Express response.
 *
 * @example
 * // 404 – resource not found
 * return errorResponse(res, 'Lead not found', 404);
 *
 * @example
 * // 400 – validation errors from express-validator
 * const errs = validationResult(req).array();
 * return errorResponse(res, 'Validation failed', 400, errs);
 */
export const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

// ---------------------------------------------------------------------------
// paginatedResponse
// ---------------------------------------------------------------------------

/**
 * Sends a paginated list response.
 *
 * Use this for any endpoint that returns a list that supports pagination
 * (e.g. `GET /api/leads?page=2&limit=10`).
 *
 * The `pages`, `hasNext`, and `hasPrev` fields are computed server-side so
 * the frontend never has to recalculate them.
 *
 * @param {import('express').Response} res     - Express response object.
 * @param {Array}                      data    - The current page of results.
 * @param {number}                     total   - Total documents matching the query.
 * @param {number}                     page    - Current page number (1-indexed).
 * @param {number}                     limit   - Number of items per page.
 * @param {Object}                     [extras={}] - Additional pagination fields to merge
 *                                               into the envelope (e.g. { hasNext, hasPrev }).
 * @returns {import('express').Response} The Express response.
 *
 * @example
 * const [leads, total] = await Promise.all([
 *   Lead.find(filter).skip(skip).limit(limit),
 *   Lead.countDocuments(filter),
 * ]);
 * const pages   = Math.ceil(total / limit) || 1;
 * return paginatedResponse(res, leads, total, page, limit, {
 *   hasNext: page < pages,
 *   hasPrev: page > 1,
 * });
 * // -> 200 {
 * //     success: true,
 * //     data: [...],
 * //     pagination: { total: 87, page: 2, limit: 10, pages: 9, hasNext: true, hasPrev: true }
 * //   }
 */
export const paginatedResponse = (res, data, total, page, limit, extras = {}) => {
  const pages = Math.ceil(total / limit) || 1;
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      /** Total documents matching the query (across all pages). */
      total,
      /** Current page number, 1-indexed. */
      page,
      /** Items returned per page. */
      limit,
      /** Total number of pages — computed here so the client doesn't have to. */
      pages,
      /** Convenience flag: true when a next page exists. */
      hasNext: extras.hasNext ?? page < pages,
      /** Convenience flag: true when a previous page exists. */
      hasPrev: extras.hasPrev ?? page > 1,
    },
  });
};
