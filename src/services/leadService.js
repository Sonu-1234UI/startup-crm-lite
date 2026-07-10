/**
 * @file src/services/leadService.js
 * @description Lead CRUD service — wraps all /api/leads endpoints.
 *
 * Every function:
 *   - Uses the pre-configured `api` Axios instance (auto-injects the JWT).
 *   - Returns `response.data` (the unwrapped body: { success, message, data }).
 *   - Throws AxiosError on failure; callers (LeadContext) catch and show toasts.
 *
 * Endpoint map (matches backend routes/leadRoutes.js exactly):
 *   GET    /api/leads                → getLeads(params)
 *   POST   /api/leads                → createLead(leadData)
 *   PUT    /api/leads/:id            → updateLead(id, leadData)
 *   PATCH  /api/leads/:id/status     → updateLeadStatus(id, status)
 *   DELETE /api/leads/:id            → deleteLead(id)
 *   GET    /api/leads/stats          → getLeadStats()
 *   GET    /api/leads/stats/monthly  → getMonthlyStats()
 */

import api from './api.js';

// ---------------------------------------------------------------------------
// getLeads
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated, filterable list of leads for the authenticated user.
 *
 * @param {object} [params]              - Optional query parameters.
 * @param {string} [params.status]       - Filter by pipeline status.
 * @param {string} [params.search]       - Case-insensitive search on name, company, email.
 * @param {number} [params.page=1]       - Page number (1-indexed).
 * @param {number} [params.limit=20]     - Items per page.
 * @param {string} [params.sortBy]       - Field to sort by (default: 'createdAt').
 * @param {string} [params.sortOrder]    - 'asc' | 'desc' (default: 'desc').
 *
 * @returns {Promise<{success: boolean, data: Lead[], pagination: object}>}
 *   `pagination` has shape: { total, page, limit, pages }
 */
export const getLeads = async (params = {}) => {
  // Axios serialises the `params` object as query string automatically.
  const response = await api.get('/api/leads', { params });
  return response.data;
};

// ---------------------------------------------------------------------------
// createLead
// ---------------------------------------------------------------------------

/**
 * Creates a new lead assigned to the authenticated user.
 *
 * @param {object} leadData          - Lead fields.
 * @param {string} leadData.name     - Contact's full name (required, min 2 chars).
 * @param {string} leadData.company  - Company name (required).
 * @param {string} leadData.email    - Email address (required, valid format).
 * @param {string} [leadData.phone]  - Phone number.
 * @param {string} [leadData.status] - Pipeline status (defaults to 'New').
 * @param {string} [leadData.source] - Acquisition source (defaults to 'Website').
 * @param {string} [leadData.notes]  - Free-form notes.
 *
 * @returns {Promise<{success: boolean, message: string, data: Lead}>}
 *   The newly created Lead document.
 */
export const createLead = async (leadData) => {
  const response = await api.post('/api/leads', leadData);
  return response.data;
};

// ---------------------------------------------------------------------------
// updateLead
// ---------------------------------------------------------------------------

/**
 * Updates all allowed fields of an existing lead.
 * The backend prevents the `owner` field from being changed.
 *
 * @param {string} id           - MongoDB ObjectId of the lead to update.
 * @param {object} leadData     - Fields to update (all optional for partial update).
 *
 * @returns {Promise<{success: boolean, message: string, data: Lead}>}
 *   The updated Lead document.
 */
export const updateLead = async (id, leadData) => {
  const response = await api.put(`/api/leads/${id}`, leadData);
  return response.data;
};

// ---------------------------------------------------------------------------
// updateLeadStatus
// ---------------------------------------------------------------------------

/**
 * Performs a lightweight status-only update.
 * Used by kanban drag-and-drop interactions where only the status changes.
 *
 * @param {string} id     - MongoDB ObjectId of the lead.
 * @param {string} status - One of the 6 LEAD_STATUSES values.
 *
 * @returns {Promise<{success: boolean, message: string, data: Lead}>}
 *   The updated Lead document with the new status.
 */
export const updateLeadStatus = async (id, status) => {
  const response = await api.patch(`/api/leads/${id}/status`, { status });
  return response.data;
};

// ---------------------------------------------------------------------------
// deleteLead
// ---------------------------------------------------------------------------

/**
 * Permanently deletes a lead. This action is irreversible.
 *
 * @param {string} id - MongoDB ObjectId of the lead to delete.
 *
 * @returns {Promise<{success: boolean, message: string, data: {message: string}}>}
 *   Returns `{ message: 'Lead deleted successfully' }` in `data`.
 */
export const deleteLead = async (id) => {
  const response = await api.delete(`/api/leads/${id}`);
  return response.data;
};

// ---------------------------------------------------------------------------
// getLeadStats
// ---------------------------------------------------------------------------

/**
 * Fetches aggregated pipeline statistics for the authenticated user's leads.
 *
 * Uses a MongoDB aggregation pipeline on the backend for a single-round-trip
 * response. The shape matches what the Dashboard StatsCard components expect.
 *
 * @returns {Promise<{success: boolean, data: {
 *   totalLeads: number,
 *   wonLeads: number,
 *   lostLeads: number,
 *   activeLeads: number,
 *   conversionRate: number,
 *   byStatus: Record<string, number>
 * }}>}
 */
export const getLeadStats = async () => {
  // Route: GET /api/leads/stats (NOTE: NOT /stats/summary — matches the backend)
  const response = await api.get('/api/leads/stats');
  return response.data;
};

// ---------------------------------------------------------------------------
// getMonthlyStats
// ---------------------------------------------------------------------------

/**
 * Fetches month-by-month lead creation and win counts for the last 6 months.
 * Used by the Analytics page BarChart and LineChart components.
 *
 * @returns {Promise<{success: boolean, data: Array<{
 *   month: string,
 *   year: number,
 *   total: number,
 *   won: number
 * }>}>}
 *   Array of 6 objects ordered oldest → newest.
 */
export const getMonthlyStats = async () => {
  const response = await api.get('/api/leads/stats/monthly');
  return response.data;
};
