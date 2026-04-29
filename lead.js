/**
 * /api/lead — accepts form submissions, forwards to Web3Forms.
 * The Web3Forms key is stored as a Vercel env var, never seen by the browser.
 */

const requests = new Map();
const RATE = { windowMs: 60_000, max: 5 };

function limited(ip) {
  const now = Date.now();
  const arr = (requests.get(ip) || []).filter(t => now - t < RATE.windowMs);
  if (arr.length >= RATE.max) return true;
  arr.push(now);
  requests.set(ip, arr);
  if (requests.size > 1000) {
    for (const [k, v] of requests) {
      if (v.every(t => now - t > RATE.windowMs)) requests.delete(k);
    }
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (allowed.length && !allowed.includes(origin)) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again in a minute.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  if (body.botcheck) return res.status(200).json({ ok: true });

  const phone = String(body.phone || '').trim();
  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return res.status(400).json({ ok: false, error: 'Valid phone required' });
  }

  const safe = (s, max) => String(s || '').slice(0, max);
  const lead = {
    type: safe(body.type, 50),
    name: safe(body.name, 200),
    phone: safe(phone, 30),
    email: safe(body.email, 200),
    projectType: safe(body.projectType, 100),
    role: safe(body.role, 100),
    message: safe(body.message, 5000),
    resume: safe(body.resume, 200)
  };

  const subject = body.subject ? safe(body.subject, 200) : `New ${lead.type || 'enquiry'}`;
  const messageBody = [
    lead.name && `Name: ${lead.name}`,
    lead.phone && `Phone: ${lead.phone}`,
    lead.email && `Email: ${lead.email}`,
    lead.projectType && `Project type: ${lead.projectType}`,
    lead.role && `Role: ${lead.role}`,
    lead.resume && `Resume file: ${lead.resume}`,
    lead.message && `\nMessage:\n${lead.message}`
  ].filter(Boolean).join('\n');

  const key = process.env.WEB3FORMS_KEY;
  if (!key) {
    console.error('WEB3FORMS_KEY env var not set');
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  try {
    const r = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: key,
        subject,
        from_name: 'AM Architects Website',
        message: messageBody,
        name: lead.name,
        phone: lead.phone,
        email: lead.email
      })
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('Web3Forms error:', r.status, text);
      return res.status(502).json({ ok: false, error: 'Lead delivery failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Lead handler error:', e);
    return res.status(500).json({ ok: false, error: 'Lead delivery failed' });
  }
}
