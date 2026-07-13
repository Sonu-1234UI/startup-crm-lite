/**
 * @file controllers/leadController.js
 * @description Complete CRUD + analytics controllers for the Lead resource.
 *
 * Every handler enforces owner isolation: all queries include
 * { owner: req.user._id } so a user can never access another user's leads.
 *
 * Exported functions (route handlers):
 *   getLeads          — GET  /api/leads
 *   searchLeads       — GET  /api/leads/search?q=ali&limit=5
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
import Lead, { LEAD_STATUSES, LEAD_SOURCES } from '../models/Lead.js';
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
 * Returns a paginated, filterable, sortable list of leads owned by the
 * current authenticated user.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 *
 * Query params (all optional):
 * @param {string}  [req.query.page='1']          - 1-indexed page number.
 * @param {string}  [req.query.limit='20']         - Items per page (max 100).
 * @param {string}  [req.query.sortBy='createdAt'] - Field to sort by.
 * @param {string}  [req.query.sortOrder='desc']   - 'asc' | 'desc'.
 * @param {string}  [req.query.status]             - Exact pipeline status to filter on
 *                                                   (ignored if 'All' or absent).
 * @param {string}  [req.query.search]             - Case-insensitive substring search
 *                                                   across name, company, and email.
 * @param {string}  [req.query.source]             - Exact lead source to filter on.
 * @param {string}  [req.query.dateFrom]           - ISO-8601 start date (createdAt >= value).
 * @param {string}  [req.query.dateTo]             - ISO-8601 end date   (createdAt <= value).
 *
 * Output shape:
 * {
 *   success: true,
 *   data: Lead[],
 *   pagination: {
 *     total:   number,   // Total matching documents
 *     page:    number,   // Current page (1-indexed)
 *     limit:   number,   // Items per page
 *     pages:   number,   // Total number of pages
 *     hasNext: boolean,  // Whether a next page exists
 *     hasPrev: boolean,  // Whether a previous page exists
 *   }
 * }
 *
 * @type {import('express').RequestHandler}
 */
export const getLeads = async (req, res, next) => {
  try {
    const {
      status,
      search,
      source,
      dateFrom,
      dateTo,
      page      = 1,
      limit     = 20,
      sortBy    = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page,  10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // cap at 100
    const skip     = (pageNum - 1) * limitNum;

    // ── Build dynamic filter ──────────────────────────────────────────────
    // Always scope to the authenticated user's own leads.
    const filter = { owner: req.user._id };

    // status — only add when provided and not 'All'
    if (status && status !== 'All') {
      filter.status = status;
    }

    // source — only add when provided and not 'All'
    if (source && source !== 'All') {
      filter.source = source;
    }

    // search — case-insensitive regex across name, company, email
    if (search && search.trim() !== '') {
      filter.$or = [
        { name:    { $regex: search.trim(), $options: 'i' } },
        { company: { $regex: search.trim(), $options: 'i' } },
        { email:   { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // dateFrom / dateTo — filter on createdAt using $gte / $lte
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from.getTime())) filter.createdAt.$gte = from;
      }
      if (dateTo) {
        // Set time to end-of-day so the entire dateTo date is included.
        const to = new Date(dateTo);
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = to;
        }
      }
      // Clean up empty object if neither value was valid
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    devLog(`getLeads -> filter: ${JSON.stringify(filter)}, page: ${pageNum}, limit: ${limitNum}`);

    // ── Whitelist sortBy to prevent injection ─────────────────────────────
    const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'name', 'company', 'status', 'source'];
    const safeSortBy = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir    = sortOrder === 'asc' ? 1 : -1;

    // ── Execute query + count in parallel ────────────────────────────────
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ [safeSortBy]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }), // include virtual `age` field
      Lead.countDocuments(filter),
    ]);

    const pages   = Math.ceil(total / limitNum) || 1;
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    devLog(`getLeads -> found ${leads.length} of ${total} total (page ${pageNum}/${pages})`);

    return paginatedResponse(res, leads, total, pageNum, limitNum, { hasNext, hasPrev });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// searchLeads — GET /api/leads/search?q=ali&limit=5
// ---------------------------------------------------------------------------

/**
 * Quick-search endpoint designed for autocomplete / SearchBar debounce.
 * Returns only the minimal fields needed to render a suggestion list.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 *
 * Query params:
 * @param {string} [req.query.q]         - Search term (regex against name, company, email).
 * @param {string} [req.query.limit='5'] - Max results to return (capped at 10 for performance).
 *
 * Output shape:
 * {
 *   success: true,
 *   data: Array<{ _id, name, company, email, status }>
 * }
 *
 * Edge cases:
 *   - Empty query returns [] (avoids full-collection scan).
 *   - Results are always limited to <= 10 regardless of the `limit` param.
 *
 * @type {import('express').RequestHandler}
 */
export const searchLeads = async (req, res, next) => {
  try {
    const { q = '', limit = 5 } = req.query;

    // Return empty array for blank queries — avoids unnecessary DB work.
    if (!q || q.trim() === '') {
      return successResponse(res, [], 'Search results');
    }

    const limitNum = Math.min(10, Math.max(1, parseInt(limit, 10)));

    devLog(`searchLeads -> q: "${q}", limit: ${limitNum}, user: ${req.user._id}`);

    const results = await Lead.find(
      {
        owner: req.user._id,
        $or: [
          { name:    { $regex: q.trim(), $options: 'i' } },
          { company: { $regex: q.trim(), $options: 'i' } },
          { email:   { $regex: q.trim(), $options: 'i' } },
        ],
      },
      // Project only the fields needed for autocomplete
      { _id: 1, name: 1, company: 1, email: 1, status: 1 }
    )
      .limit(limitNum)
      .lean();

    devLog(`searchLeads -> found ${results.length} results for "${q}"`);

    return successResponse(res, results, 'Search results');
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

    devLog(`createLead -> user: ${req.user._id}, email: ${email}`);

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

    devLog(`createLead -> created lead _id: ${lead._id}`);

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
    devLog(`getLeadById -> id: ${req.params.id}, user: ${req.user._id}`);

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
    devLog(`updateLead -> id: ${req.params.id}, user: ${req.user._id}`);

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

    devLog(`updateLead -> updated lead _id: ${lead._id}`);

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

    devLog(`updateLeadStatus -> id: ${req.params.id}, status: ${status}`);

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
    devLog(`deleteLead -> id: ${req.params.id}, user: ${req.user._id}`);

    const lead = await Lead.findOne({
      _id:   req.params.id,
      owner: req.user._id,
    });

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    await lead.deleteOne();

    devLog(`deleteLead -> deleted lead _id: ${req.params.id}`);

    return successResponse(res, { message: 'Lead deleted successfully' }, 'Lead deleted successfully');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// getLeadStats — GET /api/leads/stats
// ---------------------------------------------------------------------------

/**
 * Returns comprehensive aggregated statistics for the authenticated user's
 * leads using a SINGLE MongoDB aggregation pipeline ($facet) — one DB round-trip.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 *
 * Output shape:
 * {
 *   totalLeads:       number,   // All leads owned by this user
 *   wonLeads:         number,   // Leads with status === 'Won'
 *   lostLeads:        number,   // Leads with status === 'Lost'
 *   activeLeads:      number,   // totalLeads - wonLeads - lostLeads
 *   conversionRate:   number,   // (wonLeads / totalLeads * 100) rounded to 1 dp
 *                               //   -> 0 when totalLeads === 0 (division-by-zero guard)
 *   statusBreakdown:  object,   // { New: 5, Contacted: 3, Won: 10, Lost: 2, ... }
 *   sourceBreakdown:  object,   // { Website: 8, LinkedIn: 5, Referral: 3, ... }
 *   thisMonthLeads:   number,   // Leads created in the current calendar month
 *   lastMonthLeads:   number,   // Leads created in the previous calendar month
 *   growthRate:       number,   // ((thisMonth - lastMonth) / lastMonth) * 100 -> 1 dp
 *                               //   -> 100 when lastMonth === 0 and thisMonth > 0
 *                               //   -> 0   when both months are 0
 *   byStatus:         object,   // Alias of statusBreakdown (backward-compat)
 * }
 *
 * @type {import('express').RequestHandler}
 */
export const getLeadStats = async (req, res, next) => {
  try {
    devLog(`getLeadStats -> user: ${req.user._id}`);

    // Pre-compute month boundaries for "this month" and "last month".
    const now            = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(),     1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Last day of last month at 23:59:59.999
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(),     0, 23, 59, 59, 999);

    const ownerId = new mongoose.Types.ObjectId(req.user._id);

    // Single aggregation pipeline using $facet for multiple sub-computations
    const [result] = await Lead.aggregate([
      // ── Stage 1: Scope to current user ─────────────────────────────────
      { $match: { owner: ownerId } },

      // ── Stage 2: $facet — run all branches in ONE DB round-trip ─────────
      {
        $facet: {
          // Branch A: Count per pipeline status
          statusBreakdown: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],

          // Branch B: Count per acquisition source
          sourceBreakdown: [
            { $group: { _id: '$source', count: { $sum: 1 } } },
          ],

          // Branch C: How many leads were created this calendar month
          thisMonth: [
            { $match: { createdAt: { $gte: thisMonthStart } } },
            { $count: 'count' },
          ],

          // Branch D: How many leads were created last calendar month
          lastMonth: [
            { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    // ── Transform facet output into the final stats object ───────────────

    // statusBreakdown — pre-seed all statuses to 0 so missing ones aren't absent
    const statusBreakdown = LEAD_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    (result.statusBreakdown || []).forEach(({ _id, count }) => {
      if (_id) statusBreakdown[_id] = count;
    });

    // sourceBreakdown — pre-seed all sources to 0
    const sourceBreakdown = LEAD_SOURCES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    (result.sourceBreakdown || []).forEach(({ _id, count }) => {
      if (_id) sourceBreakdown[_id] = count;
    });

    // Derived totals from statusBreakdown
    const totalLeads     = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);
    const wonLeads       = statusBreakdown['Won']  || 0;
    const lostLeads      = statusBreakdown['Lost'] || 0;
    const activeLeads    = totalLeads - wonLeads - lostLeads;

    // Division-by-zero guard: return 0 when there are no leads at all
    const conversionRate = totalLeads > 0
      ? parseFloat(((wonLeads / totalLeads) * 100).toFixed(1))
      : 0;

    const thisMonthLeads = result.thisMonth?.[0]?.count ?? 0;
    const lastMonthLeads = result.lastMonth?.[0]?.count ?? 0;

    // Growth rate with division-by-zero guard:
    //   - lastMonth === 0 && thisMonth  > 0 -> 100% growth
    //   - lastMonth === 0 && thisMonth === 0 -> 0% (no change)
    //   - otherwise: standard percentage change
    let growthRate = 0;
    if (lastMonthLeads === 0) {
      growthRate = thisMonthLeads > 0 ? 100 : 0;
    } else {
      growthRate = parseFloat(
        (((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100).toFixed(1)
      );
    }

    const stats = {
      totalLeads,
      wonLeads,
      lostLeads,
      activeLeads,
      conversionRate,
      statusBreakdown,
      sourceBreakdown,
      thisMonthLeads,
      lastMonthLeads,
      growthRate,
      // byStatus is a backward-compatible alias for existing Dashboard consumers
      byStatus: statusBreakdown,
    };

    devLog(
      `getLeadStats -> total: ${totalLeads}, won: ${wonLeads}, ` +
      `rate: ${conversionRate}%, thisMonth: ${thisMonthLeads}, ` +
      `lastMonth: ${lastMonthLeads}, growth: ${growthRate}%`
    );

    return successResponse(res, stats, 'Lead stats fetched successfully');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// getMonthlyStats — GET /api/leads/stats/monthly
// ---------------------------------------------------------------------------

/**
 * Returns month-by-month lead creation, win, loss counts, and conversion rates
 * for the last 6 calendar months. Used by Analytics BarChart / LineChart.
 *
 * Results are always sorted oldest → newest so charts render left-to-right
 * in chronological order. Months with zero activity are included as 0.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 *
 * Output: Array of exactly 6 objects ordered oldest --> newest:
 * [
 *   {
 *     month:          'Jan 2025',  // Human-readable label for chart axis
 *     total:          12,          // All leads created in this month
 *     won:            4,           // Leads with status 'Won' created this month
 *     lost:           2,           // Leads with status 'Lost' created this month
 *     conversionRate: 33.3,        // (won / total) * 100, rounded to 1 dp
 *                                  //   -> 0 when total === 0 (division-by-zero guard)
 *   },
 *   ...
 * ]
 *
 * Edge cases:
 *   - conversionRate is 0 when total === 0 (division-by-zero guard).
 *   - Months with no leads get { total: 0, won: 0, lost: 0, conversionRate: 0 }.
 *
 * @type {import('express').RequestHandler}
 */
export const getMonthlyStats = async (req, res, next) => {
  try {
    devLog(`getMonthlyStats -> user: ${req.user._id}`);

    // Build the 6-month window (from the start of 6 months ago to now).
    const now          = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const pipeline = [
      // ── Stage 1: Scope to current user + last 6 months ─────────────────
      {
        $match: {
          owner:     new mongoose.Types.ObjectId(req.user._id),
          createdAt: { $gte: sixMonthsAgo },
        },
      },

      // ── Stage 2: Group by year + month, tally total / won / lost ────────
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: 1 },
          won: {
            $sum: { $cond: [{ $eq: ['$status', 'Won']  }, 1, 0] },
          },
          lost: {
            $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] },
          },
        },
      },

      // ── Stage 3: Sort chronologically (oldest first for left-to-right charts)
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ];

    const rawResults = await Lead.aggregate(pipeline);

    // ── Build a complete 6-bucket array, filling zeros for empty months ───
    const MONTH_NAMES = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec',
    ];

    // Index raw results by "YYYY-MM" for O(1) lookup.
    const resultMap = {};
    rawResults.forEach(({ _id, total, won, lost }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
      resultMap[key] = { total, won, lost };
    });

    // Generate 6 consecutive month buckets ending at the current month.
    // i = 5 -> oldest month (left), i = 0 -> current month (right).
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed
      const key   = `${year}-${String(month).padStart(2, '0')}`;
      const data  = resultMap[key] || { total: 0, won: 0, lost: 0 };

      // Division-by-zero guard: conversionRate = 0 when there are no leads.
      const conversionRate = data.total > 0
        ? parseFloat(((data.won / data.total) * 100).toFixed(1))
        : 0;

      monthlyStats.push({
        month:          `${MONTH_NAMES[month - 1]} ${year}`,
        total:          data.total,
        won:            data.won,
        lost:           data.lost,
        conversionRate,
      });
    }

    devLog(`getMonthlyStats -> returning ${monthlyStats.length} months`);

    return successResponse(res, monthlyStats, 'Monthly stats fetched successfully');
  } catch (error) {
    return next(error);
  }
};
