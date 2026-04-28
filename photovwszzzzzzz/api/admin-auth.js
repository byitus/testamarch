/**
 * /api/admin-auth — validates the admin password server-side
 * Returns a signed token that the client uses to access the admin panel.
 *
 * The actual password (or its hash) is stored as an env var on Vercel,
 * never reaches the browser.
 */

import crypto from 'crypto';

// Track failed attempts per IP for brute-force protection
const failures = new Map();
const LOCKOUT = { windowMs: 5 * 60_000, max: 10 }; // 10 fails in 5 min = locked

function isLocked(ip) {
  const now = Date.now();
  const arr = (failures.get(ip) || []).filter(t => now - t < LOCKOUT.windowMs);
  failures.set(ip, arr);
  return arr.length >= LOCKOUT.max;
}
function recordFailure(ip) {
  const arr = failures.get(ip) || [];
  arr.push(Date.now());
  failures.set(ip, arr);
}

// Generate a signed session token (HMAC) — valid for 4 hours
function makeToken(secret) {
  const expiresAt = Date.now() + 4 * 60 * 60 * 1000;
  const payload = `admin:${expiresAt}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64');
}

// Verify token (used by admin-action endpoint if you add one later)
export function verifyToken(token, secret) {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [, expires, sig] = decoded.match(/^admin:(\d+):([a-f0-9]+)$/) || [];
    if (!expires || !sig) return false;
    if (Date.now() > parseInt(expires)) return false;
    const expected = crypto.createHmac('sha256', secret).update(`admin:${expires}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Lock to allowed origins
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (allowedOrigins.length && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isLocked(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many failed attempts. Try again in 5 minutes.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const password = String(body?.password || '');
  if (!password) return res.status(400).json({ ok: false, error: 'Password required' });

  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!expected || !secret) {
    console.error('ADMIN_PASSWORD or ADMIN_TOKEN_SECRET env var not set');
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(password.padEnd(128, '\0').slice(0, 128));
  const b = Buffer.from(expected.padEnd(128, '\0').slice(0, 128));
  if (!crypto.timingSafeEqual(a, b)) {
    recordFailure(ip);
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  // Success — issue a 4-hour token
  return res.status(200).json({ ok: true, token: makeToken(secret) });
}
