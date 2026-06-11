import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
console.log('error:', error);
console.log('users:', data?.users?.map(u => ({ id: u.id, email: u.email })));
