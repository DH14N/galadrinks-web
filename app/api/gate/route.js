import { NextResponse } from "next/server";

// Handles the password form on /gate. Correct password → sets the
// unlock cookie for 30 days and returns the visitor to the page they
// originally asked for.
export async function POST(request) {
  const form = await request.formData();
  const attempt = (form.get("password") || "").toString();
  const from = (form.get("from") || "/").toString();
  const expected = process.env.PREVIEW_PASSWORD;

  // Only allow redirects within this site
  const target = from.startsWith("/") ? from : "/";

  if (expected && attempt === expected) {
    const res = NextResponse.redirect(new URL(target, request.url), 303);
    res.cookies.set("gala_preview", Buffer.from(expected).toString("base64"), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  }

  const back = new URL("/gate", request.url);
  back.searchParams.set("error", "1");
  back.searchParams.set("from", target);
  return NextResponse.redirect(back, 303);
}
