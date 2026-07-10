/**
 * @file models/User.js
 * @description Mongoose model for application users.
 *
 * Handles authentication-related concerns:
 *  - Password hashing via bcryptjs pre-save middleware
 *  - Password comparison via instance method
 *  - Password field removal from JSON serialization
 *
 * ES6 module — requires `"type": "module"` in package.json.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Schema Definition
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} UserSchema
 * @property {string}  name      - The user's display name.
 * @property {string}  email     - The user's unique email address.
 * @property {string}  password  - Bcrypt-hashed password (never plain text).
 * @property {string}  role      - Permission level: 'admin' or 'user'.
 * @property {boolean} isActive  - Whether the account is currently enabled.
 * @property {Date}    createdAt - Auto-managed by Mongoose timestamps.
 * @property {Date}    updatedAt - Auto-managed by Mongoose timestamps.
 */
const userSchema = new mongoose.Schema(
  {
    /**
     * Full display name of the user.
     * - Must be between 2 and 50 characters.
     * - Leading/trailing whitespace is trimmed automatically.
     */
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    /**
     * Unique email address used for login and identification.
     * - Normalised to lowercase before persisting.
     * - Validated against a standard email regex.
     * - Sparse unique index ensures no duplicates while allowing future nulls.
     */
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        /**
         * RFC 5322-inspired regex — catches the most common malformed addresses
         * without being overly strict (e.g. allows sub-domains and TLDs of any length).
         */
        validator(value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Email must be a valid email address',
      },
    },

    /**
     * Bcrypt-hashed password.
     * - Plain-text passwords are NEVER stored; the pre-save hook hashes them.
     * - Minimum 6 characters enforced at schema level (before hashing).
     * - The field is excluded from JSON output via the toJSON override below.
     */
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },

    /**
     * Permission role assigned to the user.
     * - 'admin' — full system access.
     * - 'user'  — standard CRM access (default).
     */
    role: {
      type: String,
      enum: {
        values: ['admin', 'user'],
        message: "Role must be either 'admin' or 'user'",
      },
      default: 'user',
    },

    /**
     * Indicates whether the user account is active.
     * Inactive accounts can be soft-deleted without removing data.
     * Defaults to true on registration.
     */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    /**
     * Automatically adds `createdAt` and `updatedAt` fields managed by Mongoose.
     * These are ISO Date objects stored in UTC.
     */
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Pre-save Middleware
// ---------------------------------------------------------------------------

/**
 * Hashes the password before saving the document whenever it has been modified.
 *
 * Using 10 salt rounds balances security (≈ 100 ms on modern hardware) and
 * performance. Skips re-hashing when the password field has not changed so
 * that other field updates (e.g. role, isActive) remain fast.
 *
 * @this {mongoose.Document} The User document being saved.
 * @param {Function} next - Call to proceed to the next middleware / save operation.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});
// ---------------------------------------------------------------------------
// Instance Methods
// ---------------------------------------------------------------------------

/**
 * Compares a plain-text candidate password against the stored bcrypt hash.
 *
 * @async
 * @param {string} candidatePassword - The plain-text password supplied by the client.
 * @returns {Promise<boolean>} Resolves to `true` if the passwords match, `false` otherwise.
 *
 * @example
 * const isMatch = await user.comparePassword('mySecret123');
 * if (!isMatch) throw new Error('Invalid credentials');
 */
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ---------------------------------------------------------------------------
// JSON Serialization Override
// ---------------------------------------------------------------------------

/**
 * Overrides Mongoose's default `toJSON` transformation to strip the `password`
 * field from any JSON representation of a User document.
 *
 * This prevents accidental password hash exposure in API responses, logs, or
 * any `JSON.stringify` call, regardless of how the document is serialised.
 *
 * @returns {Object} A plain object without the `password` field.
 */
userSchema.methods.toJSON = function toJSON() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// ---------------------------------------------------------------------------
// Model & Named Exports
// ---------------------------------------------------------------------------

/**
 * Compiled Mongoose model for the 'users' collection.
 * Use this for all database operations (find, save, update, delete).
 */
const User = mongoose.model('User', userSchema);

export { userSchema };
export default User;
