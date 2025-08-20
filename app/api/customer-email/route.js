import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
  try {
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
