import { supabaseAdmin } from '../integrations/supabase/client.js';

export async function subscribeToNewsletter(
  tenantId: string | number,
  email: string
): Promise<void> {
  await supabaseAdmin
    .from('newsletter')
    .insert({ email, tenant_id: String(tenantId), created_at: new Date().toISOString() });
}
