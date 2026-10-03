import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return Response.json({ error: 'Sign in required' }, { status: 401, headers: cors });
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return Response.json({ error: 'Invalid session' }, { status: 401, headers: cors });
    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: 'order_id is required' }, { status: 400, headers: cors });

    const admin = createClient(url, serviceKey);
    const { data: order, error } = await admin.from('orders').select('*').eq('id', order_id).single();
    if (error || !order) return Response.json({ error: 'Order not found' }, { status: 404, headers: cors });
    const { data: profile } = await admin.from('profiles').select('role').eq('id', authData.user.id).single();
    if (order.user_id !== authData.user.id && profile?.role !== 'admin') {
      return Response.json({ error: 'Not allowed' }, { status: 403, headers: cors });
    }

    const apiKey = Deno.env.get('MAILGUN_API_KEY');
    const domain = Deno.env.get('MAILGUN_DOMAIN');
    const from = Deno.env.get('MAILGUN_FROM') ?? `Herbal Might <orders@${domain}>`;
    if (!apiKey || !domain) return Response.json({ ok: true, email_sent: false, reason: 'Mailgun is not configured' }, { headers: cors });
    const lines = (order.items as Array<{name:string; quantity:number; unit_price:number}>)
      .map((item) => `<li>${item.name} × ${item.quantity} — ₦${(item.unit_price * item.quantity).toLocaleString()}</li>`).join('');
    const form = new FormData();
    form.set('from', from);
    form.set('to', order.customer_email);
    form.set('subject', `Thank you for your order from Herbal Might`);
    form.set('html', `<div style="font-family:Arial,sans-serif;color:#1A3C34"><h1>Thank you for your order from Herbal Might</h1><p>Order ${order.id}</p><ul>${lines}</ul><p><b>Total: ₦${Number(order.total_amount).toLocaleString()}</b></p><p>We’ll be in touch with delivery updates.</p></div>`);
    const mail = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST', headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` }, body: form,
    });
    if (!mail.ok) throw new Error(`Mailgun returned ${mail.status}`);
    return Response.json({ ok: true, email_sent: true }, { headers: cors });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500, headers: cors });
  }
});
