/**
 * @file config/database.js
 * @description MongoDB Atlas connection manager using Mongoose.
 *
 * Exports a single `connectDB()` function that is called once at server
 * startup. On success it logs the connected host; on failure it logs the
 * error and terminates the process so the container/PM2 process manager can
 * restart cleanly rather than leaving the app in a broken state.
 */

import mongoose from 'mongoose';
import 'dotenv/config'; // Ensures .env variables are loaded even if called before server.js

// ---------------------------------------------------------------------------
// Connection Options
// ---------------------------------------------------------------------------

/**
 * Mongoose connection options.
 *
 * Note: `useNewUrlParser` and `useUnifiedTopology` were removed in Mongoose v9
 * (they are now always enabled by the driver and passing them throws an error).
 * Add any driver-level tuning here as needed (e.g. serverSelectionTimeoutMS).
 *
 * @type {mongoose.ConnectOptions}
 */
const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 10_000, // Give Atlas 10 s to respond before failing fast
};

// ---------------------------------------------------------------------------
// connectDB
// ---------------------------------------------------------------------------

/**
 * Establishes a connection to MongoDB Atlas using the URI stored in
 * `process.env.MONGODB_URI`.
 *
 * Call this function once at application startup (before `app.listen`).
 * The function is intentionally async so `server.js` can `await` it and
 * guarantee the database is ready before accepting HTTP requests.
 *
 * @async
 * @returns {Promise<void>} Resolves when Mongoose is connected.
 *
 * @throws Will log the error and call `process.exit(1)` instead of throwing,
 *         so the surrounding `try/catch` in server.js is purely for safety.
 *
 * @example
 * import connectDB from './config/database.js';
 * await connectDB();
 */
const connectDB = async () => {
  try {
    // mongoose.connect() returns the Mongoose instance; the connection details
    // are on the `.connection` property.
    const conn = await mongoose.connect(process.env.MONGODB_URI, MONGOOSE_OPTIONS);

    // Log the host so it is immediately obvious which cluster is being used
    // (production vs. staging) without exposing credentials.
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    // Print the full error so engineers can diagnose connection issues
    // (wrong URI, network ACL, invalid credentials, etc.).
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // Exit with a non-zero code so process managers (PM2, Docker, Kubernetes)
    // know the process failed and should restart it.
    process.exit(1);
  }
};

export default connectDB;
