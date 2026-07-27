import { createClient } from '@supabase/supabase-js';

// The client is created inside the request handler (not at module load)
// so the app can still BUILD in environments where the Supabase
// variables aren't configured.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req) {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Not configured' }), { status: 503 });
    }

    const entered = String((await req.json()).customer_number ?? '').trim();
    if (!entered) {
      return new Response(JSON.stringify({ error: 'customer_number required' }), { status: 400 });
    }

    // Account references come from Sage and can mix letters and numbers
    // (GAL001, abc12). Customers won't type the capitals the same way every
    // time, so match without caring about case — but still exactly, so
    // "GAL1" can never sign anyone in as "GAL10".
    //
    // % _ and * mean "anything" to the database, so they're escaped first;
    // the result is then checked properly in code rather than trusted.
    const pattern = entered.replace(/[\\%_*]/g, (c) => '\\' + c);

    const { data } = await admin
      .from('customers')
      .select('customer_number, contact_email')
      .ilike('customer_number', pattern)
      .limit(5);

    const match = (data || []).find(
      (c) => (c.customer_number || '').trim().toLowerCase() === entered.toLowerCase()
    );

    if (!match?.contact_email) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ email: match.contact_email }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
