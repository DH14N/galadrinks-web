import { redirect } from "next/navigation";

// Order history now lives in the trade area
export default function OrdersRedirect() {
  redirect("/trade/orders");
}
