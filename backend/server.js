/**
 * @file server.js
 * @description Application entry point for Startup CRM Lite backend.
 *
 * Startup sequence:
 *  1. Load environment variables from .env
 *  2. Initialise the Express application with all middleware
 *  3. Register API routes
 *  4. Register the global error handler (must be LAST)
 *  5. Connect to MongoDB Atlas
 *  6. Start the HTTP server
 *
 * The server will not bind to a port until the database connection is
 * confirmed, preventing the app from accepting requests with no DB access.
 */

// ── 1. Environment Variables ───────────────────────────────────────────────
// Must be the very first import so every subsequent module can access
// process.env values (including database.js, which reads MONGODB_URI).
import 'dotenv/config';

// ── 2. Third-party Dependencies ────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// ── 3. Internal Modules ────────────────────────────────────────────────────
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';

// ---------------------------------------------------------------------------
// Express App Initialisation
// ---------------------------------------------------------------------------

const app = express();

// ---------------------------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------------------------

/**
 * helmet()
 *
 * Sets ~15 security-related HTTP response headers in one call:
 *  - Content-Security-Policy
 *  - X-Content-Type-Options
 *  - X-Frame-Options
 *  - Strict-Transport-Security (HSTS)
 *  - …and more.
 *
 * Always place this first so all subsequent responses include these headers.
 */
app.use(helmet());

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

/**
 * cors()
 *
 * Restricts cross-origin requests to the URL specified in FRONTEND_URL.
 * `credentials: true` is required to forward cookies / auth headers from
 * the browser (needed for JWT stored in httpOnly cookies).
 *
 * In development FRONTEND_URL is typically http://localhost:5173 (Vite).
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// Request Logging
// ---------------------------------------------------------------------------

/**
 * morgan('dev')
 *
 * Logs every HTTP request to stdout in a concise, colourised format:
 *   GET /api/health 200 3ms - 42b
 *
 * Only active in development — swap to 'combined' (Apache format) or a
 * structured logger (winston, pino) for production deployments.
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// Body Parsers
// ---------------------------------------------------------------------------

/**
 * express.json({ limit: '10kb' })
 *
 * Parses incoming requests with JSON payloads and exposes them on req.body.
 * The 10 kb size limit mitigates large-payload denial-of-service attacks.
 */
app.use(express.json({ limit: '10kb' }));

/**
 * express.urlencoded({ extended: true })
 *
 * Parses URL-encoded form bodies (application/x-www-form-urlencoded).
 * `extended: true` allows nested objects via the `qs` library.
 */
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Health Check Route
// ---------------------------------------------------------------------------

/**
 * GET /api/health
 *
 * A lightweight endpoint used by load balancers, container orchestrators
 * (Kubernetes, ECS), and uptime monitors (UptimeRobot, Checkly) to verify
 * the server is alive without hitting the database.
 *
 * Returns:
 *  200 { status: 'OK', timestamp: <ISO Date> }
 */
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

/**
 * All route handlers are mounted under /api/* so they are clearly
 * distinguishable from any static file serving added in future.
 *
 * /api/auth  → authRoutes  (register, login, logout, me)
 * /api/leads → leadRoutes  (CRUD for sales leads)
 */
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// ---------------------------------------------------------------------------
// 404 — Catch-all for Unknown Routes
// ---------------------------------------------------------------------------

/**
 * Any request that reaches here did not match a registered route.
 * Forward a structured error to the global error handler with status 404
 * rather than Express's default HTML "Cannot GET /xyz" response.
 */
app.use((_req, _res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------

/**
 * MUST be registered after all routes and other middleware.
 * Express identifies this as an error handler because it declares 4 params.
 * All `next(err)` calls from routes/middleware flow through here.
 */
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Database Connection → Server Start
// ---------------------------------------------------------------------------

/**
 * Connect to MongoDB Atlas first, then start the HTTP listener.
 * This ordering guarantees the app never accepts requests before the DB is up.
 *
 * If `connectDB()` throws, it calls `process.exit(1)` internally, so the
 * catch block here is a safety net for any edge-case async rejection.
 */
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // ── Step 1: Connect to the database ──────────────────────────────────
    await connectDB();

    // ── Step 2: Start listening for HTTP requests ─────────────────────────
    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${NODE_ENV} mode`
      );
      console.log(`📡 Health check → http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    // connectDB already logs and exits on DB failure, but guard here too
    // in case of any other startup error (port in use, etc.).
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
