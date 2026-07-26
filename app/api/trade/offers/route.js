import {
  getCustomerFromRequest,
  authErrorResponse,
  pricesForCustomer,
} from "@/lib/tradeAuth";
import { resolveOffers } from "@/lib/offers";

// This month's offers, priced for the signed-in customer.
export async function GET(request) {
  const { admin, customer, error } = await getCustomerFromRequest(request);
  if (error) return authErrorResponse(error);

  const offers = await resolveOffers(admin, (ids) =>
    pricesForCustomer(admin, customer.id, ids)
  );

  return Response.json({
    offers,
    customer: {
      number: customer.customer_number,
      name: customer.name,
      isAdmin: customer.is_admin,
    },
  });
}
