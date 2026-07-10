/**
 * @file controllers/leadController.js
 * @description Complete CRUD + analytics controllers for the Lead resource.
 *
 * Every handler enforces owner isolation: all queries include
 * { owner: req.user._id } so a user can never access another user's leads.
 *
 * Exported functions (route handlers):
 *   getLeads          — GET  /api/leads
 *   createLead        — POST /api/leads
 *   getLeadById       — GET  /api/leads/:id
 *   updateLead        — PUT  /api/leads/:id
 *   updateLeadStatus  — PATCH /api/leads/:id/status
 *   deleteLead        — DELETE /api/leads/:id
 *   getLeadStats      — GET  /api/leads/stats
 *   getMonthlyStats   — GET  /api/leads/stats/monthly
 *
 * All handlers follow the pattern:
 *   async (req, res, next) => { try { ... } catch (err) { next(err) } }
 */

import mongoose from 'mongoose';
import Lead, { LEAD_STATUSES } from '../models/Lead.js';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// Dev logger — prints only when NODE_ENV === 'development'
// ---------------------------------------------------------------------------
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') console.log('[LeadController]', ...args);
};

// ---------------------------------------------------------------------------
// getLeads — GET /api/leads
// ---------------------------------------------------------------------------

/**
 * Returns a paginated, filterable list of leads belonging to the current user.
 *
 * Query params:
 *   status    {string}  Filter by pipeline status (or 'All' to skip).
 *   search    {string}  Case-insensitive regex search on name, company, email.
 *   page      {number}  Page number, 1-indexed. Default: 1.
 *   limit     {number}  Items per page. Default: 20.
 *   sortBy    {string}  Field to sort by. Default: 'createdAt'.
 *   sortOrder {string}  'asc' or 'desc'. Default: 'desc'.
 *
 * Output:
 *   paginatedResponse with { data: Lead[], pagination: { total, page, limit, pages } }
 *
 * Side-effects: none (read-only).
 *
 * @type {import('express').RequestHandler}
 */
export const getLeads = async (req, res, next) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // cap at 100
    const skip     = (pageNum - 1) * limitNum;

    // ── Build filter ─────────────────────────────────────────────────────
    // Always scope to the authenticated user's own leads.
    const filter = { owner: req.user._id };

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i'); // case-insensitive
      filter.$or = [
        { name:    regex },
        { company: regex },
        { email:   regex },
      ];
    }

    devLog(`getLeads → filter: ${JSON.stringify(filter)}, page: ${pageNum}, limit: ${limitNum}`);

    // ── Execute query + count in parallel ────────────────────────────────
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }), // include virtual `age` field
      Lead.countDocuments(filter),
    ]);

    devLog(`getLeads → found ${leads.length} of ${total} total`);

    return paginatedResponse(res, leads, total, pageNum, limitNum);
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// createLead — POST /api/leads
// ---------------------------------------------------------------------------

/**
 * Creates a new lead and assigns it to the authenticated user.
 *
 * Input (req.body):
 *   name, company, email, phone?, status?, source?, notes?
 *
 * Output:
 *   201 successResponse with the newly created Lead document.
 *
 * Side-effects:
 *   Inserts one document into the 'leads' collection.
 *   Mongoose pre-save hooks run (none currently, but safe for future additions).
 *
 * @type {import('express').RequestHandler}
 */
export const createLead = async (req, res, next) => {
  try {
    const { name, company, email, phone, status, source, notes } = req.body;

    devLog(`createLead → user: ${req.user._id}, email: ${email}`);

    const lead = await Lead.create({
      name,
      company,
      email,
      phone,
      status,
      source,
      notes,
      owner: req.user._id, // enforce ownership
    });

    devLog(`createLead → created lead _id: ${lead._id}`);

    return successResponse(res, lead, 'Lead created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// getLeadById — GET /api/leads/:id
// ---------------------------------------------------------------------------

/**
 * Retrieves a single lead by its MongoDB _id.
 * Enforces ownership: only returns the lead if it belongs to req.user._id.
 *
 * Input:
 *   req.params.id — MongoDB ObjectId string of the lead.
 *
 * Output:
 *   200 successResponse with the Lead document.
 *   404 errorResponse if not found or not owned by the user.
 *
 * Side-effects: none (read-only).
 *
 * @type {import('express').RequestHandler}
 */
export const getLeadById = async (req, res, next) => {
  try {
    devLog(`getLeadById → id: ${req.params.id}, user: ${req.user._id}`);

    const lead = await Lead.findOne({
      _id:   req.params.id,
      owner: req.user._id,
    });

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    return successResponse(res, lead, 'Lead fetched successfully');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// updateLead — PUT /api/leads/:id
// ---------------------------------------------------------------------------

/**
 * Updates all fields of an existing lead.
 * Enforces ownership and explicitly strips the `owner` field from the update
 * to prevent privilege escalation (reassigning a lead to another user).
 *
 * Input:
 *   req.params.id — MongoDB ObjectId string.
 *   req.body      — Fields to update (name, company, email, phone, status, source, notes).
 *
 * Output:
 *   200 successResponse with the updated Lead document.
 *   404 errorResponse if not found or not owned by the user.
 *
 * Side-effects:
 *   Updates one document. Mongoose validators run (runValidators: true).
 *
 * @type {import('express').RequestHandler}
 */
export const updateLead = async (req, res, next) => {
  try {
    devLog(`updateLead → id: ${req.params.id}, user: ${req.user._id}`);

    // Destructure allowed fields — owner is intentionally NOT included.
    const { name, company, email, phone, status, source, notes } = req.body;
    const updates = { name, company, email, phone, status, source, notes };

    // Remove undefined fields so partial updates don't null out existing data.
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, // ownership check in query
      updates,
      {
        new:            true,  // return the document AFTER the update
        runValidators:  true,  // run schema validators on the update data
      }
    );

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    devLog(`updateLead → updated lead _id: ${lead._id}`);

    return successResponse(res, lead, 'Lead updated successfully');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// updateLeadStatus — PATCH /api/leads/:id/status
// ---------------------------------------------------------------------------

/**
 * Lightweight status-only update — changes a lead's pipeline stage.
 * Designed for drag-and-drop kanban UI interactions where only status changes.
 *
 * Input:
 *   req.params.id    — MongoDB ObjectId string.
 *   req.body.status  — One of the 6 valid LEAD_STATUSES values.
 *
 * Output:
 *   200 successResponse with the updated Lead document.
 *   400 errorResponse if status is not a valid enum value.
 *   404 errorResponse if not found or not owned by the user.
 *
 * Side-effects:
 *   Updates the `status` field and touches `updatedAt` on one document.
 *
 * @type {import('express').RequestHandler}
 */
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    devLog(`updateLeadStatus → id: ${req.params.id}, status: ${status}`);

    if (!status || !LEAD_STATUSES.includes(status)) {
      return errorResponse(
        res,
        `Status must be one of: ${LEAD_STATUSES.join(', ')}`,
        400
      );
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    return successResponse(res, lead, `Lead status updated to '${status}'`);
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// deleteLead — DELETE /api/leads/:id
// ---------------------------------------------------------------------------

/**
 * Permanently deletes a lead.
 * Ownership is enforced: a user can only delete their own leads.
 *
 * Input:
 *   req.params.id — MongoDB ObjectId string.
 *
 * Output:
 *   200 successResponse with { message: 'Lead deleted successfully' }.
 *   404 errorResponse if not found or not owned by the user.
 *
 * Side-effects:
 *   Hard-deletes one document from the 'leads' collection. Irreversible.
 *
 * @type {import('express').RequestHandler}
 */
export const deleteLead = async (req, res, next) => {
  try {
    devLog(`deleteLead → id: ${req.params.id}, user: ${req.user._id}`);

    const lead = await Lead.findOne({
      _id:   req.params.id,
      owner: req.user._id,
    });

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    await lead.deleteOne();

    devLog(`deleteLead → deleted lead _id: ${req.params.id}`);

    return successResponse(res, { message: 'Lead deleted successfully' }, 'Lead deleted successfully');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// getLeadStats — GET /api/leads/stats
// ---------------------------------------------------------------------------

/**
 * Returns aggregated statistics for the authenticated user's leads.
 *
 * Uses a MongoDB aggregation pipeline to compute all stats in a single DB
 * round-trip rather than making N queries (one per status).
 *
 * Output shape (matches Dashboard StatsCard expectations exactly):
 * {
 *   totalLeads:      number,   // all leads owned by this user
 *   wonLeads:        number,   // leads with status === 'Won'
 *   lostLeads:       number,   // leads with status === 'Lost'
 *   activeLeads:     number,   // totalLeads - wonLeads - lostLeads
 *   conversionRate:  number,   // (wonLeads / totalLeads * 100) rounded to 1 dp; 0 if no leads
 *   byStatus: {                // count per status key, useful for pipeline charts
 *     New: number,
 *     Contacted: number,
 *     'Meeting Scheduled': number,
 *     'Proposal Sent': number,
 *     Won: number,
 *     Lost: number,
 *   }
 * }
 *
 * Side-effects: none (read-only aggregation).
 *
 * @type {import('express').RequestHandler}
 */
export const getLeadStats = async (req, res, next) => {
  try {
    devLog(`getLeadStats → user: ${req.user._id}`);

    const pipeline = [
      // ── Stage 1: Scope to current user ───────────────────────────────
      {
        $match: { owner: new mongoose.Types.ObjectId(req.user._id) },
      },

      // ── Stage 2: Group by status, count each ─────────────────────────
      {
        $group: {
          _id:   '$status',
          count: { $sum: 1 },
        },
      },
    ];

    const statusGroups = await Lead.aggregate(pipeline);

    // Build a { status: count } map with 0 defaults for every valid status.
    const byStatus = LEAD_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    statusGroups.forEach(({ _id, count }) => { byStatus[_id] = count; });

    const totalLeads     = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const wonLeads       = byStatus['Won']  || 0;
    const lostLeads      = byStatus['Lost'] || 0;
    const activeLeads    = totalLeads - wonLeads - lostLeads;
    const conversionRate = totalLeads > 0
      ? parseFloat(((wonLeads / totalLeads) * 100).toFixed(1))
      : 0;

    const stats = {
      totalLeads,
      wonLeads,
      lostLeads,
      activeLeads,
      conversionRate,
      byStatus,
    };

    devLog(`getLeadStats → total: ${totalLeads}, won: ${wonLeads}, rate: ${conversionRate}%`);

    return successResponse(res, stats, 'Lead stats fetched successfully');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// getMonthlyStats — GET /api/leads/stats/monthly
// ---------------------------------------------------------------------------

/**
 * Returns month-by-month lead creation and win counts for the last 6 months.
 * Used by the Analytics page BarChart and LineChart components.
 *
 * Output: Array of 6 objects ordered oldest → newest:
 * [
 *   { month: 'Jan', year: 2026, total: 5, won: 2 },
 *   { month: 'Feb', year: 2026, total: 8, won: 3 },
 *   ...
 * ]
 *
 * Implementation:
 *   - Filters leads created in the last 6 calendar months.
 *   - Groups by { year, month } using $dateToString.
 *   - Counts total and won leads per bucket.
 *   - Fills in months with zero activity so the chart always has 6 points.
 *
 * Side-effects: none (read-only aggregation).
 *
 * @type {import('express').RequestHandler}
 */
export const getMonthlyStats = async (req, res, next) => {
  try {
    devLog(`getMonthlyStats → user: ${req.user._id}`);

    // Build the 6-month window (from the start of 6 months ago to now).
    const now      = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const pipeline = [
      // ── Stage 1: Scope to current user + last 6 months ───────────────
      {
        $match: {
          owner:     new mongoose.Types.ObjectId(req.user._id),
          createdAt: { $gte: sixMonthsAgo },
        },
      },

      // ── Stage 2: Group by year + month ───────────────────────────────
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: 1 },
          won: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Won'] }, 1, 0],
            },
          },
        },
      },

      // ── Stage 3: Sort chronologically ────────────────────────────────
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ];

    const rawResults = await Lead.aggregate(pipeline);

    // ── Build a complete 6-bucket array, filling zeros for empty months ─
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Index raw results by "YYYY-MM" for fast lookup.
    const resultMap = {};
    rawResults.forEach(({ _id, total, won }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
      resultMap[key] = { total, won };
    });

    // Generate 6 consecutive month buckets ending at current month.
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed
      const key   = `${year}-${String(month).padStart(2, '0')}`;
      const data  = resultMap[key] || { total: 0, won: 0 };

      monthlyStats.push({
        month: MONTH_NAMES[month - 1],
        year,
        total: data.total,
        won:   data.won,
      });
    }

    devLog(`getMonthlyStats → returning ${monthlyStats.length} months`);

    return successResponse(res, monthlyStats, 'Monthly stats fetched successfully');
  } catch (error) {
    return next(error);
  }
};
