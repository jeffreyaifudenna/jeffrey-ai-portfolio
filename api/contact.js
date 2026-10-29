/* Contact form endpoint (Vercel serverless function).
   Sends the message from your Gmail account to yourself over SMTP. Environment variables (Vercel project settings):
     GMAIL_USER          required, the Gmail address that sends (and by default receives)
     GMAIL_APP_PASSWORD  required, a Google app password (not your normal password)
     CONTACT_TO          optional, a different inbox to deliver to */

const nodemailer = require('nodemailer');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const message = clean(body.message, 5000);

  /* Honeypot: real visitors never see this field, bots fill it. Pretend success. */
  if (body.website) return res.status(200).json({ ok: true });

  if (!name || !message || !EMAIL.test(email)) {
    return res.status(400).json({ error: 'Please fill in your name, a valid email and a message.' });
  }

  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return res.status(503).json({ error: 'The form is not set up yet.' });

  try {
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transport.sendMail({
      from: 'Portfolio contact <' + user + '>',
      to: process.env.CONTACT_TO || user,
      replyTo: name.replace(/[\r\n"<>]+/g, ' ') + ' <' + email + '>',
      subject: 'Portfolio message from ' + name.replace(/[\r\n]+/g, ' '),
      text: 'From: ' + name + ' <' + email + '>\n\n' + message
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact form send failed:', e.message);
    return res.status(502).json({ error: 'Could not send right now. Please try again later.' });
  }
};

function clean(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function safeParse(s) { try { return JSON.parse(s); } catch (e) { return {}; } }
