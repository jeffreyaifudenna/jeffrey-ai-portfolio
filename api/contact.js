/* Contact form endpoint (Vercel serverless function).
   Sends the message from your Gmail account to yourself over SMTP. Environment variables (Vercel project settings):
     GMAIL_USER          required, the Gmail address that sends (and by default receives)
     GMAIL_APP_PASSWORD  required, a Google app password (not your normal password)
     CONTACT_TO          optional, a different inbox to deliver to

   Abuse limits, no extra services: same-origin check, JSON only, a honeypot field, a minimum time on the page,
   and a small per-IP rate limit. */

const nodemailer = require('nodemailer');

const SITE = 'https://jeffrey-ai-portfolio.vercel.app';
/* One plain address only: no list separators, angle brackets, quotes or comments, which nodemailer would parse as extra syntax. */
const EMAIL = /^[^\s@,;<>()"\\]+@[^\s@,;<>()"\\]+\.[^\s@,;<>()"\\]+$/;
const MIN_MS = 3000;                  /* faster than this after page load is a bot */
const MAX_MS = 24 * 60 * 60 * 1000;   /* a page left open over a day is treated as stale */
const LIMIT = 5, WINDOW_MS = 10 * 60 * 1000;   /* 5 sends per IP per 10 minutes */
const DEV_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/* Best effort only: this map lives in one warm function instance. Vercel may run several instances and
   recycles them, so a determined sender can get past it. It stops casual repeat submissions. */
const hits = new Map();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!/^application\/json\b/i.test(header(req, 'content-type'))) {
    return res.status(415).json({ error: 'Please send the form from the contact page.' });
  }

  if (!sameOrigin(req)) return res.status(403).json({ error: 'Please send the form from the contact page.' });

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) || {};
  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const message = clean(body.message, 5000);

  /* Honeypot: real visitors never see this field, bots fill it. Pretend success. */
  if (body.website) return res.status(200).json({ ok: true });

  /* Time on page in ms, measured by the page itself (no clock skew). Too fast or missing: pretend success. */
  const elapsed = Number(body.t);
  if (!Number.isFinite(elapsed) || elapsed < MIN_MS || elapsed > MAX_MS) return res.status(200).json({ ok: true });

  if (limited(clientIp(req))) {
    res.setHeader('Retry-After', String(Math.ceil(WINDOW_MS / 1000)));
    return res.status(429).json({ error: 'Too many messages in a short time. Please try again later.' });
  }

  if (!name || !message || !EMAIL.test(email)) {
    return res.status(400).json({ error: 'Please fill in your name, a valid email and a message.' });
  }

  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return res.status(503).json({ error: 'The form is not set up yet.' });

  try {
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transport.sendMail({
      from: { name: 'Portfolio contact', address: user },
      to: process.env.CONTACT_TO || user,
      replyTo: { name: name.replace(/[\r\n]+/g, ' '), address: email },
      subject: 'Portfolio message from ' + name.replace(/[\r\n]+/g, ' '),
      text: 'From: ' + name + ' <' + email + '>\n\n' + message
    });
    /* One-time thank-you carrying the free guide. The message to you already went out, so a failure here is only logged. */
    try {
      await transport.sendMail({
        from: 'Jeffrey Fudenna <' + user + '>',
        to: email,
        replyTo: process.env.CONTACT_TO || user,
        subject: 'Thanks for writing. Here is the free guide to using AI',
        text: 'Hi ' + name.replace(/[\r\n]+/g, ' ') + ',\n\n' +
          'Thanks for your message. I read everything and will reply personally.\n\n' +
          'In the meantime, here is the short guide I promised: seven habits for getting real work out of AI, a five-minute read.\n\n' +
          SITE + '/guide.html\n\n' +
          'Jeffrey\n\n' +
          'You are getting this once because you used the contact form at ' + SITE + '/contact.html. I will not add you to a list.'
      });
    } catch (e) {
      console.error('guide reply failed:', e.message);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact form send failed:', e.message);
    return res.status(502).json({ error: 'Could not send right now. Please try again later.' });
  }
};

function header(req, k) { const v = req.headers && req.headers[k]; return Array.isArray(v) ? v[0] || '' : v || ''; }

/* The request must come from a page on this same host (whatever domain the site is served on), or localhost in dev. */
function sameOrigin(req) {
  const src = header(req, 'origin') || header(req, 'referer');
  if (!src) return false;
  let host;
  try { host = new URL(src).host.toLowerCase(); } catch (e) { return false; }
  const own = header(req, 'x-forwarded-host') || header(req, 'host');
  if (own && host === own.toLowerCase()) return true;
  return DEV_HOSTS.includes(host.replace(/:\d+$/, ''));
}

function clientIp(req) {
  const fwd = header(req, 'x-forwarded-for').split(',')[0].trim();
  return fwd || header(req, 'x-real-ip') || (req.socket && req.socket.remoteAddress) || 'unknown';
}

function limited(ip) {
  const now = Date.now(), recent = (hits.get(ip) || []).filter(function (t) { return now - t < WINDOW_MS; });
  if (recent.length >= LIMIT) { hits.set(ip, recent); return true; }
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(function (t) { return now - t < WINDOW_MS; })) hits.delete(k);
  return false;
}

function clean(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function safeParse(s) { try { return JSON.parse(s); } catch (e) { return {}; } }
