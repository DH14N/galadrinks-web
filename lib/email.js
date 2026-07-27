// ---------------------------------------------------------------------------
// Sending email.
//
// Works one of two ways, whichever is set up:
//
//   1. SMTP (what we use — the Zoho mailbox on galadrinks.co.uk)
//        SMTP_HOST      smtppro.zoho.eu
//        SMTP_PORT      465
//        SMTP_USER      kirt@galadrinks.co.uk
//        SMTP_PASSWORD  an app-specific password from Zoho
//
//   2. Resend, if a RESEND_API_KEY is set instead
//
// Shared settings:
//   EMAIL_FROM     e.g. "Gala Drinks <kirt@galadrinks.co.uk>"
//   ORDERS_EMAIL   where order alerts and enquiries go
//
// If neither is configured the site carries on working — messages are
// logged instead of sent, so nothing ever breaks because of email.
// ---------------------------------------------------------------------------

import nodemailer from "nodemailer";

const FROM =
  process.env.EMAIL_FROM ||
  (process.env.SMTP_USER ? `Gala Drinks <${process.env.SMTP_USER}>` : "Gala Drinks <onboarding@resend.dev>");

export const ORDERS_EMAIL =
  process.env.ORDERS_EMAIL || process.env.SMTP_USER || "sales@galadrinks.co.uk";

// Re-used between requests so we're not reconnecting every time
let transport = null;
function smtpTransport() {
  if (transport) return transport;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);
  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,   // 465 = SSL, 587 = STARTTLS
    auth: { user, pass },
  });
  return transport;
}

export async function sendEmail({ to, subject, html, replyTo }) {
  const recipients = Array.isArray(to) ? to : [to];

  // ---------------------------------------------------------- 1. SMTP
  const mailer = smtpTransport();
  if (mailer) {
    try {
      await mailer.sendMail({
        from: FROM,
        to: recipients.join(", "),
        subject,
        html,
        ...(replyTo ? { replyTo } : {}),
      });
      return { ok: true };
    } catch (err) {
      console.error("[email smtp failed]", err.message);
      return { ok: false, error: err.message };
    }
  }

  // ------------------------------------------------------- 2. Resend
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: recipients,
          subject,
          html,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error(`[email failed] ${res.status}: ${detail}`);
        return { ok: false, error: detail };
      }
      return { ok: true };
    } catch (err) {
      console.error("[email error]", err.message);
      return { ok: false, error: err.message };
    }
  }

  // ------------------------------------------------- nothing set up yet
  console.log(`[email not configured] would send "${subject}" to ${recipients.join(", ")}`);
  return { ok: false, skipped: true };
}

// ---------------------------------------------------------------- templates

const money = (pence) => "£" + ((pence || 0) / 100).toFixed(2);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

function shell(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3efe7;font-family:Helvetica,Arial,sans-serif;color:#17202f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe7;padding:28px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e8e3d7;border-radius:14px;overflow:hidden">
    <tr><td style="background:#101c33;padding:20px 26px">
      <span style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:.3px">Gala</span>
      <span style="font-size:20px;font-weight:bold;color:#d9a441;letter-spacing:.3px">Drinks</span>
      <div style="margin-top:3px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d9a441">${esc(title)}</div>
    </td></tr>
    <tr><td style="padding:26px">${bodyHtml}</td></tr>
    <tr><td style="border-top:1px solid #e8e3d7;padding:18px 26px;font-size:12px;color:#5a6474;line-height:1.7">
      Gala Drinks · 6 Vitruvius Way, Meridian Business Park, Leicester<br>
      0116 289 0111 · sales@galadrinks.co.uk
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function linesTable(lines, totals) {
  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:9px 0;border-bottom:1px solid #f0ece3;font-size:14px">
          ${esc(l.name)}${l.pack_size ? `<br><span style="font-size:12px;color:#5a6474">${esc(l.pack_size)}</span>` : ""}
        </td>
        <td style="padding:9px 0;border-bottom:1px solid #f0ece3;font-size:14px;text-align:center;white-space:nowrap">${l.qty}</td>
        <td style="padding:9px 0;border-bottom:1px solid #f0ece3;font-size:14px;text-align:right;white-space:nowrap">${money(l.unit_price_pence)}</td>
        <td style="padding:9px 0;border-bottom:1px solid #f0ece3;font-size:14px;text-align:right;white-space:nowrap;font-weight:bold">${money(l.qty * l.unit_price_pence)}</td>
      </tr>`
    )
    .join("");

  const summary = (label, value, bold) => `<tr>
      <td colspan="3" style="padding-top:${bold ? 11 : 7}px;text-align:right;font-size:${bold ? 15 : 13}px;color:${bold ? "#17202f" : "#5a6474"}${bold ? ";font-weight:bold" : ""}">${label}</td>
      <td style="padding-top:${bold ? 11 : 7}px;text-align:right;font-size:${bold ? 19 : 14}px;${bold ? "font-weight:bold" : "color:#5a6474"}">${money(value)}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-collapse:collapse">
    <tr>
      <th align="left"   style="padding-bottom:7px;border-bottom:2px solid #17202f;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#5a6474">Product</th>
      <th align="center" style="padding-bottom:7px;border-bottom:2px solid #17202f;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#5a6474">Qty</th>
      <th align="right"  style="padding-bottom:7px;border-bottom:2px solid #17202f;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#5a6474">Each</th>
      <th align="right"  style="padding-bottom:7px;border-bottom:2px solid #17202f;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#5a6474">Total</th>
    </tr>
    ${rows}
    ${summary("Subtotal (ex VAT)", totals.net)}
    ${summary("VAT", totals.vat)}
    ${summary("Total to pay", totals.gross, true)}
  </table>`;
}

// Sent to the customer who ordered
export function orderConfirmationEmail({ customerName, orderRef, lines, totals, notes }) {
  return shell(
    "Order received",
    `<p style="margin:0 0 6px;font-size:17px;font-weight:bold">Thanks, ${esc(customerName)} — we’ve got your order.</p>
     <p style="margin:0;font-size:14px;color:#5a6474;line-height:1.6">
       Your order reference is <strong style="color:#17202f">${esc(orderRef)}</strong>.
       We’ll be in touch to confirm your delivery day. If anything needs changing,
       give us a ring on 0116 289 0111.
     </p>
     ${linesTable(lines, totals)}
     ${notes ? `<p style="margin:18px 0 0;padding:12px 14px;background:#f3efe7;border-radius:8px;font-size:13px;color:#5a6474"><strong style="color:#17202f">Your note:</strong> ${esc(notes)}</p>` : ""}`
  );
}

// Sent to the office
export function orderNotificationEmail({ customerName, customerNumber, customerEmail, orderRef, lines, totals, notes }) {
  return shell(
    "New online order",
    `<p style="margin:0 0 6px;font-size:17px;font-weight:bold">New order from ${esc(customerName)}</p>
     <p style="margin:0;font-size:14px;color:#5a6474;line-height:1.7">
       Account <strong style="color:#17202f">${esc(customerNumber)}</strong><br>
       ${customerEmail ? `${esc(customerEmail)}<br>` : ""}
       Reference <strong style="color:#17202f">${esc(orderRef)}</strong>
     </p>
     ${linesTable(lines, totals)}
     ${notes ? `<p style="margin:18px 0 0;padding:12px 14px;background:#f3efe7;border-radius:8px;font-size:13px;color:#5a6474"><strong style="color:#17202f">Customer note:</strong> ${esc(notes)}</p>` : ""}
     <p style="margin:22px 0 0">
       <a href="https://www.galadrinks.co.uk/admin/orders" style="display:inline-block;background:#17202f;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:bold">Open in admin</a>
     </p>`
  );
}

// Sent to the office when someone uses the contact form
export function enquiryEmail({ business, name, email, phone, message }) {
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:5px 0;font-size:13px;color:#5a6474;width:110px">${label}</td>
             <td style="padding:5px 0;font-size:14px;font-weight:bold">${esc(value)}</td></tr>`
      : "";

  return shell(
    "Website enquiry",
    `<p style="margin:0 0 14px;font-size:17px;font-weight:bold">New enquiry from the website</p>
     <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
       ${row("Business", business)}
       ${row("Name", name)}
       ${row("Email", email)}
       ${row("Phone", phone)}
     </table>
     ${message ? `<p style="margin:16px 0 0;padding:14px;background:#f3efe7;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(message)}</p>` : ""}`
  );
}
