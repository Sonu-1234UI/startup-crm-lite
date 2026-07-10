/**
 * @file src/context/LeadContext.jsx
 * @description Global lead state connected to the Express/MongoDB backend API.
 *
 * This replaces the previous localStorage-based implementation.
 * All CRUD operations now call the real API via leadService.js and update
 * local React state on success, keeping the UI in sync with the database.
 *
 * State shape:
 *   leads      : Lead[]     — current page of leads (array of Mongoose documents)
 *   isLoading  : boolean    — true while any API call is in flight
 *   pagination : object     — { total, page, limit, pages } from paginatedResponse
 *
 * Exported:
 *   LeadContext  — the React context object
 *   LeadProvider — wraps the app to provide state
 *   useLeads     — custom hook for consuming the context
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import toast from 'react-hot-toast';
import * as leadService from '../services/leadService.js';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const LeadContext = createContext(undefined);

// ---------------------------------------------------------------------------
// LeadProvider
// ---------------------------------------------------------------------------

/**
 * Provides lead state and CRUD actions to the entire component tree.
 *
 * On mount, `fetchLeads()` is called with no params to load the first page
 * of leads so the dashboard and leads list have data immediately.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const LeadProvider = ({ children }) => {
  // ── State ───────────────────────────────────────────────────────────────
  const [leads,      setLeads]      = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page:  1,
    limit: 20,
    pages: 0,
  });

  // ── fetchLeads ──────────────────────────────────────────────────────────

  /**
   * Fetches leads from the API with optional filtering, search, and pagination.
   *
   * @param {object} [params]           - Query params forwarded to GET /api/leads
   * @param {string} [params.status]    - Filter by status ('All' or specific status)
   * @param {string} [params.search]    - Search term for name/company/email
   * @param {number} [params.page]      - Page number (1-indexed)
   * @param {number} [params.limit]     - Items per page
   * @param {string} [params.sortBy]    - Sort field
   * @param {string} [params.sortOrder] - 'asc' | 'desc'
   *
   * Side-effects: updates `leads`, `pagination`, `isLoading`
   */
  const fetchLeads = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const result = await leadService.getLeads(params);

      // paginatedResponse shape: { success, data: Lead[], pagination: {...} }
      setLeads(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      // Extract the API error message or fall back to a generic one.
      const message = error?.response?.data?.message || 'Failed to load leads.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── addLead ─────────────────────────────────────────────────────────────

  /**
   * Creates a new lead via POST /api/leads, then prepends it to local state.
   *
   * Prepending (unshift) keeps the list sorted newest-first without a refetch.
   *
   * @param {object} data - Lead fields (name, company, email, etc.)
   * @returns {Promise<object|null>} The created Lead document, or null on error.
   */
  const addLead = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const result = await leadService.createLead(data);
      const newLead = result.data;

      // Prepend to avoid a full refetch — optimistic UI.
      setLeads(prev => [newLead, ...prev]);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));

      toast.success('Lead created successfully! 🎉');
      return newLead;
    } catch (error) {
      const message = _extractErrorMessage(error, 'Failed to create lead.');
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── updateLead ──────────────────────────────────────────────────────────

  /**
   * Updates an existing lead via PUT /api/leads/:id, then syncs local state.
   *
   * Uses MongoDB's `_id` field (not the old localStorage `id` field) since
   * the backend now manages IDs.
   *
   * @param {string} id         - The lead's MongoDB _id.
   * @param {object} data       - Updated fields.
   * @returns {Promise<object|null>} The updated Lead document, or null on error.
   */
  const updateLead = useCallback(async (id, data) => {
    setIsLoading(true);
    try {
      const result = await leadService.updateLead(id, data);
      const updatedLead = result.data;

      // Replace the matching lead in local state using _id.
      setLeads(prev =>
        prev.map(lead => (lead._id === id ? updatedLead : lead))
      );

      toast.success('Lead updated successfully! ✅');
      return updatedLead;
    } catch (error) {
      const message = _extractErrorMessage(error, 'Failed to update lead.');
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── deleteLead ──────────────────────────────────────────────────────────

  /**
   * Permanently deletes a lead via DELETE /api/leads/:id.
   *
   * @param {string} id - The lead's MongoDB _id.
   * @returns {Promise<boolean>} True on success, false on error.
   */
  const deleteLead = useCallback(async (id) => {
    setIsLoading(true);
    try {
      await leadService.deleteLead(id);

      // Remove from local state immediately.
      setLeads(prev => prev.filter(lead => lead._id !== id));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));

      toast.success('Lead deleted.', { icon: '🗑️' });
      return true;
    } catch (error) {
      const message = _extractErrorMessage(error, 'Failed to delete lead.');
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Context value ────────────────────────────────────────────────────────

  const value = {
    leads,
    isLoading,
    pagination,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
  };

  return (
    <LeadContext.Provider value={value}>
      {children}
    </LeadContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// useLeads — custom hook
// ---------------------------------------------------------------------------

/**
 * Custom hook for consuming LeadContext.
 *
 * @returns {{ leads, isLoading, pagination, fetchLeads, addLead, updateLead, deleteLead }}
 * @throws {Error} If used outside of <LeadProvider>.
 */
export const useLeads = () => {
  const context = useContext(LeadContext);

  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadProvider');
  }

  return context;
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Extracts a user-friendly error message from an Axios error.
 * Checks for:
 *   1. Server validation error array (express-validator format)
 *   2. Server message string
 *   3. Falls back to the provided default message
 *
 * @param {Error} error          - The caught error object.
 * @param {string} defaultMsg    - Fallback message.
 * @returns {string}
 */
function _extractErrorMessage(error, defaultMsg) {
  const serverData = error?.response?.data;
  if (!serverData) return defaultMsg;

  // express-validator errors array: [{ field, message }]
  if (Array.isArray(serverData.errors) && serverData.errors.length > 0) {
    return serverData.errors.map(e => e.message).join(' ');
  }

  return serverData.message || defaultMsg;
}
