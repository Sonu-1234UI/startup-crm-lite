/**
 * Smoke test for the auth API.
 * Run with: node test-auth.mjs
 * Requires server already running on port 5000.
 */

const BASE = 'http://localhost:5000/api/auth';
const H = { 'Content-Type': 'application/json' };

const safeJson = async (res) => {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

const post = (path, body, token) => fetch(`${BASE}${path}`, {
  method: 'POST',
  headers: token ? { ...H, Authorization: `Bearer ${token}` } : H,
  body: JSON.stringify(body),
});

const get = (path, token) => fetch(`${BASE}${path}`, {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

const log = (label, status, body) =>
  console.log(`\n── ${label} ──\n  Status : ${status}\n  Body   : ${JSON.stringify(body, null, 2)}`);

(async () => {
  // ── 1. Register (valid) ────────────────────────────────────────────────────
  const r1 = await post('/register', { name: 'Smoke Tester', email: 'smoketest@crm.dev', password: 'secret123' });
  const j1 = await safeJson(r1);
  log('1. Register (valid) — expect 201', r1.status, j1);
  const token = j1?.data?.token;

  // ── 2. Register (duplicate) ───────────────────────────────────────────────
  const r2 = await post('/register', { name: 'Smoke Tester', email: 'smoketest@crm.dev', password: 'secret123' });
  log('2. Duplicate email — expect 409', r2.status, await safeJson(r2));

  // ── 3. Login (valid) ──────────────────────────────────────────────────────
  const r3 = await post('/login', { email: 'smoketest@crm.dev', password: 'secret123' });
  log('3. Login valid — expect 200', r3.status, await safeJson(r3));

  // ── 4. Login (wrong password) ─────────────────────────────────────────────
  const r4 = await post('/login', { email: 'smoketest@crm.dev', password: 'wrongpass' });
  log('4. Wrong password — expect 401', r4.status, await safeJson(r4));

  // ── 5. GET /me (valid token) ──────────────────────────────────────────────
  const r5 = await get('/me', token);
  log('5. GET /me valid token — expect 200', r5.status, await safeJson(r5));

  // ── 6. GET /me (no token) ─────────────────────────────────────────────────
  const r6 = await get('/me', null);
  log('6. GET /me no token — expect 401', r6.status, await safeJson(r6));

  // ── 7. GET /me (tampered token) ───────────────────────────────────────────
  const r7 = await get('/me', 'bad.token.here');
  log('7. GET /me bad token — expect 401', r7.status, await safeJson(r7));

  // ── 8. Validation errors ──────────────────────────────────────────────────
  const r8 = await post('/register', { name: 'X', email: 'not-an-email', password: '123' });
  log('8. Validation errors — expect 400', r8.status, await safeJson(r8));

  console.log('\n✅ Smoke test complete.');
})();
