/**
 * /api/admin-auth — verifies admin password, returns 4-hour session token.
 * Password lives only in Vercel env vars.
 */

import crypto from 'crypto';

const failures = new Map();
const LOCK = { windowMs: 5 * 60_000, max: 10 };

function isLocked(ip) {
  const now = Date.now();
  const arr = (failures.get(ip) || []).filter(t => now - t < LOCK.windowMs);
  failures.set(ip, arr);
  return arr.length >= LOCK.max;
}
function recordFailure(ip) {
  const arr = failures.get(ip) || [];
  arr.push(Date.now());
  failures.set(ip, arr);
}

function makeToken(secret) {
  const expires = Date.now() + 4 * 60 * 60 * 1000;
  const payload = `admin:${expires}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (allowed.length && !allowed.includes(origin)) {
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

  const a = Buffer.from(password.padEnd(128, '\0').slice(0, 128));
  const b = Buffer.from(expected.padEnd(128, '\0').slice(0, 128));
  if (!crypto.timingSafeEqual(a, b)) {
    recordFailure(ip);
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  return res.status(200).json({ ok: true, token: makeToken(secret) });
}
