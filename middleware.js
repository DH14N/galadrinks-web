import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Site-wide preview lock.
//
// Only active when the PREVIEW_PASSWORD environment variable is set
// (in Vercel: Settings → Environment Variables). Remove the variable
// and redeploy to open the site to everyone.
//
// The password itself is never in this code — visitors who enter it
// on /gate get a cookie that lasts 30 days.
// ---------------------------------------------------------------------------

export function middleware(request) {
  const password = process.env.PREVIEW_PASSWORD;
  if (!password) return NextResponse.next(); // lock disabled

  const { pathname } = request.nextUrl;

  // Always allow: the gate itself, Next.js assets, and static files.
  // /reset-password is allowed too: password-reset links carry their
  // token after a "#", which a redirect to the gate would discard,
  // silently breaking the reset. The page itself is useless without a
  // valid emailed token, so letting it through is safe.
  if (
    pathname.startsWith("/gate") ||
    pathname.startsWith("/api/gate") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/_next") ||
    /\.(png|jpg|jpeg|svg|ico|webp|txt|xml)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Already unlocked?
  const cookie = request.cookies.get("gala_preview")?.value;
  if (cookie === btoa(password)) {
    return NextResponse.next();
  }

  // Not unlocked — send to the password screen, remembering where
  // they were trying to go
  const url = request.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}
