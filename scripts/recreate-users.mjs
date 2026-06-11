import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function recreate(email, password, makeAdmin) {
  // delete if exists
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find(u => u.email === email);
  if (existing) {
    console.log('deleting', email, existing.id);
    await sb.auth.admin.deleteUser(existing.id);
  }
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) { console.error('create error', email, error); return; }
  console.log('created', email, data.user.id);
  if (makeAdmin) {
    const { error: e2 } = await sb.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
    if (e2) console.error('role error', e2);
  }
  const { data: prof } = await sb.from('profiles').select('id, role').eq('id', data.user.id).single();
  console.log('profile', email, prof);
}

await recreate('admin@teste.com', 'Admin@2026!', true);
await recreate('user@teste.com', 'User@2026!', false);
