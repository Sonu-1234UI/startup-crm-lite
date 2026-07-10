/**
 * @file models/Lead.js
 * @description Mongoose model for CRM Leads.
 *
 * A Lead represents a potential customer tracked through the sales pipeline.
 * Each lead is owned by a User and progresses through a defined set of statuses.
 *
 * Features:
 *  - Enum-constrained status & source fields that match the frontend exactly.
 *  - Virtual `age` field (days since creation) for analytics.
 *  - Compound index on (owner, status) for fast per-user pipeline queries.
 *  - Separate index on email for fast duplicate/lookup queries.
 *
 * ES6 module — requires `"type": "module"` in package.json.
 */

import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Constants — kept as named exports so the frontend/validators can reuse them
// ---------------------------------------------------------------------------

/**
 * All valid pipeline statuses a lead can hold.
 * Order matches the typical sales funnel progression.
 * @type {string[]}
 */
export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Meeting Scheduled',
  'Proposal Sent',
  'Won',
  'Lost',
];

/**
 * All valid acquisition sources for a lead.
 * @type {string[]}
 */
export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'LinkedIn',
  'Cold Call',
  'Email Campaign',
  'Other',
];

// ---------------------------------------------------------------------------
// Schema Definition
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} LeadSchema
 * @property {string}              name      - The lead contact's full name.
 * @property {string}              company   - The company the lead belongs to.
 * @property {string}              email     - Contact email for the lead.
 * @property {string}              [phone]   - Optional contact phone number.
 * @property {string}              status    - Current stage in the sales pipeline.
 * @property {string}              source    - Channel through which the lead was acquired.
 * @property {string}              [notes]   - Free-form notes about the lead (max 1000 chars).
 * @property {mongoose.Types.ObjectId} owner - Reference to the User who owns this lead.
 * @property {Date}                createdAt - Auto-managed by Mongoose timestamps.
 * @property {Date}                updatedAt - Auto-managed by Mongoose timestamps.
 */
const leadSchema = new mongoose.Schema(
  {
    /**
     * Full name of the lead's contact person.
     * - Between 2 and 100 characters.
     * - Leading/trailing whitespace is trimmed automatically.
     */
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    /**
     * Name of the company or organisation the lead is associated with.
     * - Required for meaningful CRM segmentation.
     * - Leading/trailing whitespace is trimmed automatically.
     */
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },

    /**
     * Primary contact email address for the lead.
     * - Validated against a standard email regex.
     * - Indexed for fast lookup and duplicate detection.
     */
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      validate: {
        /**
         * Lightweight email format validator.
         * Ensures the value contains exactly one "@" with non-empty local and domain parts.
         */
        validator(value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Email must be a valid email address',
      },
    },

    /**
     * Optional phone number for the lead contact.
     * - No strict format enforced to accommodate international numbers.
     * - Stored as a string to preserve leading zeros and country codes.
     */
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    /**
     * Current stage of the lead in the sales pipeline.
     * - Must be one of the values in LEAD_STATUSES.
     * - Defaults to 'New' when a lead is first created.
     * - This enum matches the frontend select options exactly.
     */
    status: {
      type: String,
      enum: {
        values: LEAD_STATUSES,
        message: `Status must be one of: ${LEAD_STATUSES.join(', ')}`,
      },
      default: 'New',
    },

    /**
     * The channel or medium through which this lead was acquired.
     * - Must be one of the values in LEAD_SOURCES.
     * - Defaults to 'Website'.
     * - Used in source attribution analytics (e.g. LeadSourceChart).
     */
    source: {
      type: String,
      enum: {
        values: LEAD_SOURCES,
        message: `Source must be one of: ${LEAD_SOURCES.join(', ')}`,
      },
      default: 'Website',
    },

    /**
     * Free-form notes or context about the lead.
     * - Optional field; may be left blank.
     * - Capped at 1000 characters to prevent abuse.
     */
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: null,
    },

    /**
     * Reference to the User document who owns/created this lead.
     * - Required to enforce data isolation between users.
     * - Used in compound index with `status` for efficient per-user queries.
     * - Populated via `.populate('owner')` when needed in API responses.
     */
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lead must have an owner'],
    },
  },
  {
    /**
     * Automatically adds and manages `createdAt` and `updatedAt` Date fields.
     * `createdAt` is also used by the `age` virtual field below.
     */
    timestamps: true,

    /**
     * Include virtual fields (e.g. `age`) when converting to JSON or plain objects.
     * This makes virtuals available in API responses automatically.
     */
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Virtual Fields
// ---------------------------------------------------------------------------

/**
 * Virtual field: `age`
 *
 * Computes and returns the number of whole days elapsed since the lead was
 * created. Useful for analytics dashboards (e.g. "leads older than 30 days")
 * and sales-velocity calculations.
 *
 * Note: This is a derived value computed at read time — it is NOT stored in
 * the database. It will appear in JSON/object output due to `toJSON: { virtuals: true }`.
 *
 * @returns {number} Integer number of days since `createdAt` (0 on the day of creation).
 *
 * @example
 * const lead = await Lead.findById(id);
 * console.log(`This lead is ${lead.age} days old.`);
 */
leadSchema.virtual('age').get(function computeAge() {
  if (!this.createdAt) return 0;
  const now = Date.now();
  const created = new Date(this.createdAt).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((now - created) / msPerDay);
});

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

/**
 * Compound index on `owner` + `status`.
 *
 * Optimises the most frequent query pattern in this CRM:
 *   "Fetch all leads belonging to a specific user, filtered by pipeline status."
 *
 * Without this index, MongoDB would perform a full collection scan for every
 * dashboard or kanban board request.
 *
 * Example query benefiting from this index:
 *   Lead.find({ owner: userId, status: 'New' })
 */
leadSchema.index({ owner: 1, status: 1 });

/**
 * Index on `email`.
 *
 * Speeds up:
 *  - Duplicate-detection lookups before inserting a new lead.
 *  - Search-by-email functionality in the CRM UI.
 *
 * Note: Unlike User.email this is NOT a unique index because the same contact
 * email may appear as a lead for multiple users/organisations.
 */
leadSchema.index({ email: 1 });

// ---------------------------------------------------------------------------
// Model & Named Exports
// ---------------------------------------------------------------------------

/**
 * Compiled Mongoose model for the 'leads' collection.
 * Use this for all database CRUD operations.
 */
const Lead = mongoose.model('Lead', leadSchema);

export { leadSchema };
export default Lead;
