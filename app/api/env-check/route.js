// TEMPORARY diagnostic — reports which Supabase settings the live server
// can see. Never reveals a value: only whether it exists and its length.
// Delete this file once the deployment settings are confirmed working.

export const dynamic = "force-dynamic";

export async function GET() {
  const names = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PREVIEW_PASSWORD",
  ];

  const report = {};
  for (const n of names) {
    const v = process.env[n];
    report[n] = v ? `present (${v.length} chars)` : "MISSING";
  }

  // Also list any other env names containing SUPABASE, to catch typos
  report._otherSupabaseNames = Object.keys(process.env)
    .filter((k) => k.toUpperCase().includes("SUPABASE") && !names.includes(k));

  report._vercelEnv = process.env.VERCEL_ENV || "(not on Vercel)";

  return Response.json(report);
}
