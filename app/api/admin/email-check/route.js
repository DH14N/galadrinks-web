import { requireAdmin, authErrorResponse } from "@/lib/tradeAuth";
import { emailSettings, verifyEmail, sendEmail, testEmail } from "@/lib/email";

// Is the website's mailbox set up and working?
//
// GET  — reports what's configured and signs in to the mailbox to prove it.
// POST — sends a test message.
//
// Admin only, and the test can only ever go to the address on the account
// of whoever is signed in — never to an address the browser asks for.

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  const settings = emailSettings();
  const connection = settings.mode === "smtp" ? await verifyEmail() : { ok: false, error: null };

  return Response.json({ settings, connection });
}

export async function POST(request) {
  const { customer, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  const to = customer.contact_email;
  if (!to) {
    return Response.json(
      { error: "There's no email address on your staff account to send the test to." },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to,
    subject: "Gala Drinks website — test email",
    html: testEmail({
      sentBy: customer.name || to,
      when: new Date().toLocaleString("en-GB", { timeZone: "Europe/London" }),
    }),
  });

  if (!result.ok) {
    return Response.json(
      { error: result.skipped ? "Email isn’t set up yet, so nothing was sent." : result.error },
      { status: 503 }
    );
  }

  return Response.json({ ok: true, to });
}
