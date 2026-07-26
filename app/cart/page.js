import { redirect } from "next/navigation";

// The basket now lives in the trade area
export default function CartRedirect() {
  redirect("/trade/basket");
}
