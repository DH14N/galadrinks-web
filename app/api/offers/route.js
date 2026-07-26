import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { products } from "@/lib/catalogue";
import { getFormat } from "@/lib/categories";

// This month's offers live on the server, so they are NEVER sent to
// visitors who aren't logged in. The list itself is shared with the
// trade offers page — edit it in lib/offers.js.
import { MONTHLY_OFFERS as deals } from "@/lib/offers";

function findByKeyword(keyword) {
  const k = keyword.toLowerCase();
  return products.find((p) => p.name.toLowerCase().includes(k)) || null;
}

export async function GET(request) {
  // The browser sends the customer's login token in the Authorization header
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Ask Supabase whether this token belongs to a real, logged-in user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Logged in — build the offers from the catalogue
  const offers = deals
    .map(({ match, deal }) => {
      const product = findByKeyword(match);
      if (!product) return null;
      return {
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        format: getFormat(product),
        deal,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ offers });
}
