/**
 * @file routes/leadRoutes.js
 * @description Express router for all Lead CRUD + analytics endpoints.
 *
 * Base path (mounted in server.js): /api/leads
 *
 * All routes in this file are protected — `router.use(protect)` is applied
 * at the top so every handler below requires a valid Bearer JWT.
 *
 * Endpoint map:
 *   GET    /api/leads                  -> getLeads          (paginated, filterable list)
 *   POST   /api/leads                  -> createLead        (create new lead)
 *   GET    /api/leads/search           -> searchLeads       (autocomplete quick-search)
 *   GET    /api/leads/stats            -> getLeadStats      (pipeline stats for dashboard)
 *   GET    /api/leads/stats/monthly    -> getMonthlyStats   (last-6-months chart data)
 *   GET    /api/leads/:id              -> getLeadById       (single lead by ID)
 *   PUT    /api/leads/:id              -> updateLead        (full update)
 *   PATCH  /api/leads/:id/status       -> updateLeadStatus  (status-only quick update)
 *   DELETE /api/leads/:id              -> deleteLead        (permanent delete)
 *
 * Validation strategy:
 *   - createLeadValidation  : strict — all required fields must be present and valid.
 *   - updateLeadValidation  : lenient — all fields optional (partial update support).
 *   - statusValidation      : single-field — only validates `status` enum value.
 *   - The `validate` middleware runs the chains and returns 400 if any fail.
 */

import { Router } from 'express';
import { body, param } from 'express-validator';

import protect   from '../middleware/auth.js';
import validate  from '../middleware/validate.js';
import {
  getLeads,
  searchLeads,
  createLead,
  getLeadById,
  updateLead,
  updateLeadStatus,
  deleteLead,
  getLeadStats,
  getMonthlyStats,
} from '../controllers/leadController.js';

// Import enum constants from the model so validation stays in sync with the DB schema.
import { LEAD_STATUSES, LEAD_SOURCES } from '../models/Lead.js';

const router = Router();

// ---------------------------------------------------------------------------
// 🔒 Global auth guard — ALL routes in this file require a valid JWT
// ---------------------------------------------------------------------------

/**
 * Applies the `protect` middleware to every route registered on this router.
 * Any request without a valid Bearer token will receive a 401 before reaching
 * any route handler or validation chain.
 */
router.use(protect);

// ---------------------------------------------------------------------------
// Validation Rule Sets
// ---------------------------------------------------------------------------

/**
 * Validation rules for POST /api/leads (createLead).
 *
 * Required fields:
 *  - name    : non-empty string, minimum 2 characters
 *  - company : non-empty string
 *  - email   : valid RFC-5321 email format
 *  - status  : must be one of the 6 LEAD_STATUSES values
 *  - source  : must be one of the 6 LEAD_SOURCES values
 *
 * Optional fields (validated only when present):
 *  - phone   : any string (free-form to support international formats)
 *  - notes   : any string up to 1000 chars (enforced at DB layer by schema)
 */
const createLeadValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Lead name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),

  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company name is required'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('status')
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),

  body('source')
    .optional()
    .isIn(LEAD_SOURCES)
    .withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),

  body('phone')
    .optional()
    .trim(),

  body('notes')
    .optional()
    .trim(),
];

/**
 * Validation rules for PUT /api/leads/:id (updateLead).
 *
 * All fields are optional here — the route supports partial updates.
 * When a field IS provided however, the same constraints as createLead apply.
 * Owner cannot be changed — that is enforced in the controller, not here.
 */
const updateLeadValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be blank')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),

  body('company')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company cannot be blank'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('status')
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),

  body('source')
    .optional()
    .isIn(LEAD_SOURCES)
    .withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),

  body('phone')
    .optional()
    .trim(),

  body('notes')
    .optional()
    .trim(),

  // Explicitly block attempts to reassign owner via the request body.
  body('owner')
    .not()
    .exists()
    .withMessage('Changing the lead owner is not permitted'),
];

/**
 * Validation rules for PATCH /api/leads/:id/status (updateLeadStatus).
 *
 * Only `status` is accepted — any other body fields are ignored by the controller.
 *  - status : required, must be one of the 6 LEAD_STATUSES values
 */
const statusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(LEAD_STATUSES)
    .withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),
];

/**
 * Param validation for routes that accept a MongoDB ObjectId in :id.
 * Returns 400 immediately if the id is not a valid ObjectId format,
 * preventing a CastError from bubbling up from Mongoose.
 */
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid lead ID format'),
];

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/leads
 * Returns a paginated, filtered list of leads owned by the authenticated user.
 *
 * Query params (all optional):
 *   status    {string}  - Filter by pipeline status ('All' returns every status)
 *   search    {string}  - Case-insensitive search on name, company, email
 *   page      {number}  - Page number (default: 1)
 *   limit     {number}  - Items per page (default: 20, capped at 100)
 *   sortBy    {string}  - Field to sort by (default: 'createdAt')
 *   sortOrder {string}  - 'asc' or 'desc' (default: 'desc')
 *
 * Returns: 200 paginatedResponse { data: Lead[], pagination: { total, page, limit, pages } }
 */
router.get('/', getLeads);

/**
 * POST /api/leads
 * Creates a new lead assigned to the authenticated user.
 *
 * Body: { name, company, email, phone?, status?, source?, notes? }
 * Returns: 201 successResponse with the created Lead document.
 */
router.post('/', createLeadValidation, validate, createLead);

// ---------------------------------------------------------------------------
// Stats routes — MUST come BEFORE /:id to avoid 'stats' being treated as an id
// ---------------------------------------------------------------------------

/**
 * GET /api/leads/stats
 * Returns aggregated pipeline statistics for the authenticated user's leads.
 *
 * Output shape (matches Dashboard StatsCard):
 *   { totalLeads, wonLeads, lostLeads, activeLeads, conversionRate, byStatus }
 *
 * Returns: 200 successResponse with stats object.
 */
router.get('/stats', getLeadStats);

/**
 * GET /api/leads/stats/monthly
 * Returns month-by-month lead creation and win counts for the last 6 months.
 * Used by the Analytics page BarChart and LineChart components.
 *
 * Output: Array of 6 objects: [{ month: 'Jan 2025', year: 2025, total: 5, won: 2, lost: 1, conversionRate: 40.0 }, ...]
 * Returns: 200 successResponse with monthly stats array.
 */
router.get('/stats/monthly', getMonthlyStats);

/**
 * GET /api/leads/search?q=ali&limit=5
 * Quick autocomplete search — returns only _id, name, company, email, status.
 * Intended for React SearchBar debounce; results are capped at 5 (max 10).
 * An empty `q` param returns [] without hitting the DB.
 *
 * Query params:
 *   q     {string}  - Search term (case-insensitive, matches name/company/email)
 *   limit {number}  - Max results (default 5, capped at 10)
 *
 * Returns: 200 successResponse with array of minimal lead objects.
 */
router.get('/search', searchLeads);

// ---------------------------------------------------------------------------
// Single-resource routes (require valid :id)
// ---------------------------------------------------------------------------

/**
 * GET /api/leads/:id
 * Retrieves a single lead by its MongoDB ObjectId.
 * Returns 404 if the lead does not exist or does not belong to the current user.
 *
 * Returns: 200 successResponse with the Lead document.
 */
router.get('/:id', idValidation, validate, getLeadById);

/**
 * PUT /api/leads/:id
 * Performs a full update of an existing lead.
 * Owner field is protected — cannot be changed via this endpoint.
 * Returns 404 if the lead does not exist or does not belong to the current user.
 *
 * Body: { name?, company?, email?, phone?, status?, source?, notes? }
 * Returns: 200 successResponse with the updated Lead document.
 */
router.put('/:id', idValidation, updateLeadValidation, validate, updateLead);

/**
 * PATCH /api/leads/:id/status
 * Lightweight status-only update — designed for kanban drag-and-drop.
 * Returns 400 if status is not a valid enum value.
 * Returns 404 if the lead does not exist or does not belong to the current user.
 *
 * Body: { status }
 * Returns: 200 successResponse with the updated Lead document.
 */
router.patch('/:id/status', idValidation, statusValidation, validate, updateLeadStatus);

/**
 * DELETE /api/leads/:id
 * Permanently deletes a lead. This action is irreversible.
 * Returns 404 if the lead does not exist or does not belong to the current user.
 *
 * Returns: 200 successResponse with { message: 'Lead deleted successfully' }
 */
router.delete('/:id', idValidation, validate, deleteLead);

export default router;
