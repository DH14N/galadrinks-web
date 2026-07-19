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

    const { customer_number } = await req.json();
    if (!customer_number) {
      return new Response(JSON.stringify({ error: 'customer_number required' }), { status: 400 });
    }
    const { data, error } = await admin
      .from('customers')
      .select('contact_email')
      .eq('customer_number', customer_number)
      .limit(1)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ email: data.contact_email }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
