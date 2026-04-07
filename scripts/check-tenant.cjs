
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  try {
    const { data: tenant, error: tErr } = await supabase.from('organizations').select('id').eq('slug', 'receitasbell').single();
    if (tErr) { console.error('Tenant fail:', tErr.message); return; }
    console.log('Tenant:', tenant.id);

    const { data: accounts, error: aErr } = await supabase.from('stripe_connect_accounts').select('*').eq('tenant_id', tenant.id);
    if (aErr) { console.error('Accounts fail:', aErr.message); return; }
    console.log('Stripe Accounts:', JSON.stringify(accounts, null, 2));
  } catch (e) {
    console.error(e);
  }
}
check();
