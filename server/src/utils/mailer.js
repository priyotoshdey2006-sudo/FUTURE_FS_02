import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Fire-and-forget: an email failure never breaks lead creation. */
export async function notifyNewLead(lead) {
  const t = getTransporter();
  if (!t || !process.env.NOTIFY_TO) {
    console.log('Email not configured - skipping new lead notification');
    return;
  }
  try {
    await t.sendMail({
      from: `"Mini CRM" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_TO,
      subject: `New lead: ${lead.name}`,
      html: `
        <h2>New lead received</h2>
        <p><b>Name:</b> ${esc(lead.name)}</p>
        <p><b>Email:</b> ${esc(lead.email)}</p>
        <p><b>Phone:</b> ${esc(lead.phone || '-')}</p>
        <p><b>Source:</b> ${esc(lead.source)}</p>
        <p><b>Message:</b><br>${esc(lead.message || '-')}</p>`,
    });
  } catch (err) {
    console.error('Email failed:', err.message);
  }
}
