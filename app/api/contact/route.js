import { sendEmail, ORDERS_EMAIL, enquiryEmail } from "@/lib/email";

// Handles the enquiry form on the contact page.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const clean = (v, max = 200) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const business = clean(body.business);
  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone, 40);
  const message = clean(body.message, 2000);

  // Hidden field that people never see — if it's filled in, it's a bot
  if (clean(body.website)) {
    return Response.json({ ok: true });   // quietly ignore
  }

  if (!name || (!email && !phone)) {
    return Response.json(
      { error: "Please give us your name and either an email or a phone number." },
      { status: 400 }
    );
  }

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "That email address doesn’t look right." }, { status: 400 });
  }

  const result = await sendEmail({
    to: ORDERS_EMAIL,
    subject: `Website enquiry — ${business || name}`,
    replyTo: email || undefined,
    html: enquiryEmail({ business, name, email, phone, message }),
  });

  // If email isn't set up yet, don't pretend it was sent
  if (!result.ok) {
    return Response.json(
      { error: "We couldn’t send that just now. Please call us on 0116 289 0111." },
      { status: 503 }
    );
  }

  return Response.json({ ok: true });
}
