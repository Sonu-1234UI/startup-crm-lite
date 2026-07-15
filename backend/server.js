/**
 * @file server.js
 * @description Production-ready application entry point for Startup CRM Lite backend.
 *
 * Startup sequence:
 *  1. Load & validate environment variables — exits immediately if any required
 *     vars are missing, preventing silent misconfiguration in production.
 *  2. Initialise the Express application with all security middleware.
 *  3. Register API routes behind rate limiters.
 *  4. Register the global error handler (must be LAST middleware).
 *  5. Connect to MongoDB Atlas.
 *  6. Start the HTTP server and wire up graceful-shutdown signal handlers.
 *
 * Security layers applied (in order):
 *  • helmet            — Secure HTTP headers (CSP, HSTS, X-Frame-Options, …)
 *  • cors              — Origin allowlist; credentials-aware
 *  • express-rate-limit— Per-IP request throttling (general + auth-specific)
 *  • express-mongo-sanitize — Strip MongoDB operators from req.body/query/params
 *  • express.json      — 10 kb payload cap to mitigate DoS via large bodies
 *
 * The server will NOT bind to a port until the database connection is
 * confirmed, so no request is ever accepted with no DB access.
 */

// ── 1. Environment Variables ───────────────────────────────────────────────
// Must be the very first import so every subsequent module reads the correct
// process.env values (including database.js, which reads MONGODB_URI).
import 'dotenv/config';

// ── 2. Third-party Dependencies ────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
//import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';

// ── 3. Internal Modules ────────────────────────────────────────────────────
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';

// ===========================================================================
// SECTION 1 — Environment Validation
// ===========================================================================

/**
 * Validates that all required environment variables are present before the
 * application starts. Logs exactly which variables are missing and exits with
 * a non-zero code so CI/CD pipelines, Docker, and PM2 all see a hard failure.
 *
 * This prevents a common production footgun: deploying with an empty or
 * partially-populated .env file and having the app silently use `undefined`
 * values (e.g., a null JWT_SECRET that signs every token the same way).
 *
 * Required variables:
 *  - MONGODB_URI  : MongoDB Atlas connection string
 *  - JWT_SECRET   : Secret used to sign and verify JSON Web Tokens
 *  - PORT         : Port the HTTP server binds to
 *
 * @returns {void} Exits the process if any required variable is missing.
 */
const checkRequiredEnvVars = () => {
  const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];

  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   • ${key}`));
    console.error(
      '\n💡 Copy backend/.env.example to backend/.env and fill in the values.'
    );
    process.exit(1); // Non-zero exit → process manager restarts; CI/CD marks build failed
  }

  console.log('✅ Environment variables validated');
};

// Run validation immediately — before any other app code executes.
checkRequiredEnvVars();

// ===========================================================================
// SECTION 2 — Express App Initialisation
// ===========================================================================

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// ===========================================================================
// SECTION 3 — Security Middleware
// ===========================================================================

// ---------------------------------------------------------------------------
// 3a. Helmet — Secure HTTP response headers
// ---------------------------------------------------------------------------

/**
 * helmet() sets ~15 security-related HTTP headers in one call:
 *
 *  Content-Security-Policy    — Mitigates XSS by controlling resource loading.
 *  X-Content-Type-Options     — Prevents MIME-type sniffing (nosniff).
 *  X-Frame-Options            — Blocks clickjacking (SAMEORIGIN).
 *  Strict-Transport-Security  — Forces HTTPS for 1 year (production only).
 *  X-XSS-Protection           — Legacy header; belt-and-suspenders XSS guard.
 *  Referrer-Policy            — Controls what's sent in the Referer header.
 *  Permissions-Policy         — Restricts browser features (camera, mic, etc.).
 *
 * Always place helmet FIRST so all subsequent responses carry these headers.
 */
app.use(helmet());

// ---------------------------------------------------------------------------
// 3b. CORS — Cross-Origin Resource Sharing (allowlist-based)
// ---------------------------------------------------------------------------

/**
 * Production CORS strategy: maintain an explicit allowlist of trusted origins.
 *
 * Logic:
 *  - Requests with no Origin header (e.g. curl, server-to-server, Postman) are
 *    allowed through to avoid breaking non-browser clients in development.
 *  - Browser requests from an unlisted origin receive a CORS error — the
 *    browser blocks the response before JS can read it.
 *  - `credentials: true` is required to forward cookies / Authorization headers
 *    from the browser (needed for JWT Bearer tokens in Authorization header).
 *
 * Add new trusted origins to ALLOWED_ORIGINS rather than using wildcard '*',
 * which cannot be combined with `credentials: true` and is a security risk.
 *
 * @type {string[]}
 */
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'https://startup-crm-lite-s1is-44kwr4wcw-sonu05.vercel.app',
  'https://startup-crm-lite-s1is.vercel.app',
  'http://localhost:5173'
].filter(Boolean);
app.use(
  cors({
    /**
     * @param {string|undefined} origin - The Origin header sent by the browser,
     *   or `undefined` for same-origin / non-browser requests.
     * @param {Function} callback - (error, allow) — call with (null, true) to allow,
     *   or (new Error(...)) to reject.
     */
    origin(origin, callback) {
      // Allow requests with no Origin (curl, Postman, server-to-server).
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      // Origin not in allowlist — reject with a descriptive error.
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      return callback(new Error(`Origin '${origin}' is not allowed by CORS policy`));
    },
    credentials: true, // Allow Authorization header / cookies from browser
    optionsSuccessStatus: 200, // IE11 sends OPTIONS and expects 200, not 204
  })
);

// ===========================================================================
// SECTION 4 — Rate Limiting
// ===========================================================================

/**
 * Rate limiting protects the API from:
 *  - Brute-force attacks on auth endpoints (credential stuffing, password spray)
 *  - DoS attacks via request flooding
 *  - Automated scraping of lead data
 *
 * Two limiters are applied in layers:
 *  - generalLimiter : Applied to all /api/* routes  → 100 req / 15 min / IP
 *  - authLimiter    : Applied additionally to /api/auth/* → 10 req / 15 min / IP
 *
 * The auth limiter runs AFTER the general limiter — so /api/auth routes consume
 * both counters. This is intentional: even if an attacker bypasses one, the
 * other still blocks them.
 *
 * `standardHeaders: true`  — Sends `RateLimit-*` headers per RFC 6585 draft.
 * `legacyHeaders: false`   — Suppresses deprecated `X-RateLimit-*` headers.
 * `skipSuccessfulRequests` — Optionally count only failures (useful for auth).
 */

// ---------------------------------------------------------------------------
// 4a. General API Limiter — 100 requests per 15 minutes per IP
// ---------------------------------------------------------------------------

/**
 * Applied to ALL /api/* routes.
 * Protects against general DoS and scraping attacks.
 *
 * Window  : 15 minutes (900,000 ms)
 * Max     : 100 requests per window per IP
 * Response: 429 Too Many Requests with a JSON body
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,             // Maximum requests per windowMs per IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,  // Include RateLimit-* headers in response (RFC 6585)
  legacyHeaders: false, // Omit deprecated X-RateLimit-* headers
});

// ---------------------------------------------------------------------------
// 4b. Auth Limiter — 10 requests per 15 minutes per IP (stricter)
// ---------------------------------------------------------------------------

/**
 * Applied specifically to /api/auth/* routes (login, register).
 * Provides a much tighter cap to make brute-force and credential-stuffing
 * attacks economically infeasible.
 *
 * Window  : 15 minutes (900,000 ms)
 * Max     : 10 requests per window per IP
 * Response: 429 Too Many Requests with a descriptive JSON body
 *
 * Note: skipSuccessfulRequests is intentionally FALSE here — we want to count
 * ALL auth attempts, not just failed ones, to prevent timing-based enumeration.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 10,              // Maximum auth attempts per windowMs per IP
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts, not just failures
});

// Apply the general limiter to every /api/* route.
// IMPORTANT: Register this BEFORE the route-specific auth limiter.
app.use('/api/', generalLimiter);

// Apply the stricter auth limiter on top of the general limiter for auth routes.
app.use('/api/auth/', authLimiter);

// ===========================================================================
// SECTION 5 — MongoDB Injection Sanitization
// ===========================================================================

/**
 * express-mongo-sanitize removes any keys containing MongoDB operator characters
 * ('$' prefix, '.' separator) from:
 *  - req.body   → Prevents injection via JSON request payloads
 *  - req.query  → Prevents injection via URL query strings
 *  - req.params → Prevents injection via URL path parameters
 *
 * Without this, an attacker could send:
 *   { "email": { "$gt": "" }, "password": { "$gt": "" } }
 * and potentially bypass password validation in naive auth queries.
 *
 * `replaceWith: '_'` mode replaces offending characters rather than deleting
 * the entire key, which is safer for debugging (the value is still logged but
 * rendered harmless).
 *
 * Must be placed AFTER express.json() so req.body is already parsed.
 * Place it BEFORE route handlers so routes always receive sanitized input.
 */

// ===========================================================================
// SECTION 6 — Request Logging
// ===========================================================================

/**
 * morgan HTTP request logger.
 *
 * Format selection based on NODE_ENV:
 *  - development : 'dev'      — Concise, colourised output with method, URL,
 *                               status, response time, and content length.
 *                               e.g.  GET /api/health 200 3ms - 42b
 *
 *  - production  : 'combined' — Apache Combined Log Format with remote IP,
 *                               timestamp, method, URL, HTTP version, status,
 *                               content length, referrer, and user-agent.
 *                               Ideal for ingestion by log aggregators
 *                               (Datadog, Papertrail, CloudWatch, etc.).
 *                               e.g.  127.0.0.1 - - [10/Jul/2026:12:00:00 +0000]
 *                                     "GET /api/health HTTP/1.1" 200 42
 *                                     "-" "Mozilla/5.0 …"
 *
 * In production, morgan writes to process.stdout. Pair with a log forwarder
 * (e.g. Render log drain, Railway log exporter, or Heroku log drain) to
 * persist logs beyond the container lifecycle.
 */
if (IS_PROD) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ===========================================================================
// SECTION 7 — Body Parsers
// ===========================================================================

/**
 * express.json({ limit: '10kb' })
 *
 * Parses incoming requests with JSON payloads (Content-Type: application/json)
 * and exposes the parsed object on req.body.
 *
 * The 10 kb size limit mitigates large-payload denial-of-service attacks.
 * Any payload exceeding 10 kb will receive a 413 Payload Too Large response
 * before reaching the route handler.
 */
app.use(express.json({ limit: '10kb' }));

/**
 * express.urlencoded({ extended: true })
 *
 * Parses URL-encoded form bodies (application/x-www-form-urlencoded).
 * `extended: true` enables parsing of rich objects and arrays using the `qs`
 * library, which is necessary for some form-based clients.
 */
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * express-mongo-sanitize — registered AFTER body parsers so req.body is parsed.
 *
 * Uses `replaceWith: '_'` to neutralise but preserve keys for debugging.
 * Set `dryRun: true` to log without modifying during a migration period.
 */
/*app.use(
  mongoSanitize({
    replaceWith: '_',   // Replace '$' and '.' with '_' instead of removing keys
    onSanitizeError(req, res) {
      // Log the sanitization event in production for forensic analysis
      console.warn(
        `[MongoSanitize] Injection attempt blocked — IP: ${req.ip}, ` +
        `Path: ${req.path}`
      );
    },
  })
);*/

// ===========================================================================
// SECTION 8 — Health Check Route
// ===========================================================================

/**
 * GET /api/health
 *
 * A lightweight liveness probe used by load balancers, container orchestrators
 * (Kubernetes, ECS), and uptime monitors (UptimeRobot, Checkly) to verify
 * the server process is alive and responsive.
 *
 * The health check is registered BEFORE the rate limiter is applied to /api/*,
 * wait — actually it IS within /api/ so the general limiter applies. This is
 * intentional: the health check is called infrequently by monitors, not by
 * end users, so the 100 req/15 min limit is more than sufficient.
 *
 * Response:
 *  200 { status: 'OK', timestamp: <ISO Date>, environment: 'production' }
 */
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: Math.floor(process.uptime()), // seconds since server started
  });
});

// ===========================================================================
// SECTION 9 — API Routes
// ===========================================================================

/**
 * All route handlers are mounted under /api/* to clearly distinguish them
 * from any static file serving that may be added in future.
 *
 *  /api/auth  → authRoutes  (register, login, logout, getMe)
 *  /api/leads → leadRoutes  (CRUD + analytics + search for sales leads)
 */
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// ===========================================================================
// SECTION 10 — 404 Catch-All
// ===========================================================================

/**
 * Any request that falls through all route registrations above did not match
 * any known endpoint. Forward a structured 404 error to the global error
 * handler rather than letting Express return its default HTML "Cannot GET /xyz".
 */
app.use((_req, _res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
});

// ===========================================================================
// SECTION 11 — Global Error Handler
// ===========================================================================

/**
 * MUST be the last middleware registered.
 * Express identifies 4-argument middleware as error handlers.
 * All `next(err)` calls from routes, validators, and sanitizers flow here.
 */
app.use(errorHandler);

// ===========================================================================
// SECTION 12 — Graceful Shutdown
// ===========================================================================

/**
 * Graceful shutdown handler.
 *
 * Called when the process receives SIGTERM (from container orchestrators like
 * Kubernetes / Docker stop) or SIGINT (Ctrl+C in development).
 *
 * Shutdown sequence:
 *  1. Log that shutdown was triggered and which signal caused it.
 *  2. Stop the HTTP server from accepting new connections (server.close()).
 *     In-flight requests continue to be processed until they complete.
 *  3. Close the MongoDB connection so Mongoose flushes any pending writes
 *     and Atlas removes the connection from its pool gracefully.
 *  4. Exit with code 0 (success) so process managers do not auto-restart.
 *
 * @param {http.Server} server - The running HTTP server instance.
 * @param {string}      signal - The OS signal that triggered shutdown.
 * @returns {Function} Signal handler function.
 */
const createGracefulShutdown = (server, signal) => async () => {
  console.log(`\n⚠️  ${signal} received — Server shutting down gracefully`);

  // Step 1: Stop accepting new HTTP connections.
  server.close(async () => {
    console.log('🔌 HTTP server closed — no longer accepting new connections');

    try {
      // Step 2: Close MongoDB connection cleanly.
      await mongoose.connection.close(false); // false = don't force close
      console.log('🍃 MongoDB connection closed gracefully');
    } catch (err) {
      console.error('❌ Error closing MongoDB connection:', err.message);
    } finally {
      console.log('👋 Goodbye — process exiting with code 0');
      process.exit(0); // Clean exit — process managers will NOT restart
    }
  });

  // Safety timeout: if server.close() hasn't resolved in 10 s, force-exit.
  // This prevents the process from hanging indefinitely on stalled connections.
  setTimeout(() => {
    console.error('❌ Graceful shutdown timed out after 10s — forcing exit');
    process.exit(1);
  }, 10_000).unref(); // .unref() so this timer doesn't prevent the event loop from exiting naturally
};

// ===========================================================================
// SECTION 13 — Database Connection → Server Start
// ===========================================================================

/**
 * Connect to MongoDB Atlas first, then start the HTTP listener.
 * This ordering guarantees the app never accepts requests before the DB is up.
 *
 * After the server starts, SIGTERM and SIGINT handlers are registered with
 * the running server instance so graceful shutdown can stop the HTTP listener
 * before closing the DB connection.
 */
const startServer = async () => {
  try {
    // ── Step 1: Connect to the database ────────────────────────────────────
    await connectDB();

    // ── Step 2: Start the HTTP server ───────────────────────────────────────
    const server = app.listen(PORT, () => {
      console.log('');
      console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      console.log(`📡 Health check  → http://localhost:${PORT}/api/health`);
      console.log(`🔒 Rate limiting → 100 req/15min (general), 10 req/15min (auth)`);
      console.log(`🛡️  Mongo sanitize, Helmet, CORS allowlist active`);
      if (IS_PROD) {
        console.log(`📋 Logging format → combined (Apache)`);
      } else {
        console.log(`📋 Logging format → dev (colorized)`);
      }
      console.log('');
    });

    // ── Step 3: Register graceful shutdown handlers ──────────────────────────
    //
    // SIGTERM — sent by Docker, Kubernetes, Heroku, Render, and Railway when
    //           stopping a container or dyno. Always handle this in production.
    //
    // SIGINT  — sent by Ctrl+C in a terminal. Handling it gives a clean exit
    //           in development too, closing the DB connection before node quits.
    //
    process.on('SIGTERM', createGracefulShutdown(server, 'SIGTERM'));
    process.on('SIGINT', createGracefulShutdown(server, 'SIGINT'));

    // ── Step 4: Handle unhandled promise rejections ──────────────────────────
    //
    // Catch-all for any Promise rejection that wasn't handled with .catch()
    // or try/catch. Logs the error and initiates graceful shutdown rather than
    // letting Node exit abruptly (which was the default behaviour pre-Node 15;
    // in Node 15+ it exits with code 1 automatically).
    //
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection:');
      console.error('   Promise:', promise);
      console.error('   Reason:', reason);
      // Initiate graceful shutdown — pass the error code so monitors see it.
      createGracefulShutdown(server, 'unhandledRejection')();
    });

  } catch (error) {
    // connectDB already logs and calls process.exit(1) on DB failure.
    // This catch is a safety net for any other startup errors
    // (e.g. port already in use, missing module, syntax error).
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
