import { requireAdmin, authErrorResponse } from "@/lib/tradeAuth";

// A deliberately tiny "are you staff?" check, used by every admin page
// so it can render straight away. No counts, no joins — just the token
// check and the account's own row.
export async function GET(request) {
  const { customer, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  return Response.json({
    ok: true,
    name: customer.name,
    number: customer.customer_number,
    email: customer.contact_email,
  });
}
