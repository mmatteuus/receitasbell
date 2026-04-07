import { supabase } from "../integrations/supabase/client.js";
import { sha256Hex } from "../shared/crypto.js";
import crypto from "node:crypto";

export async function createMagicLink(input: { tenantId: string; email: string; purpose: "user"; redirectTo?: string }) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(token);
  const exp = new Date(Date.now() + 15 * 60_000);

  const { error } = await supabase.from('auth_sessions').insert({
    tenant_id: input.tenantId,
    email: input.email.toLowerCase(),
    token_hash: tokenHash,
    expires_at: exp.toISOString(),
    role: input.purpose,
    user_agent: 'magic-link'
  });

  if (error) throw new Error(`Falha ao criar link mágico: ${error.message}`);
  return { token };
}

export async function consumeMagicLink(input: { tenantId: string; token: string; purpose: "user" }) {
  const tokenHash = sha256Hex(input.token);
  
  const { data: session, error } = await supabase
    .from('auth_sessions')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('tenant_id', input.tenantId)
    .eq('role', input.purpose)
    .eq('user_agent', 'magic-link')
    .is('revoked_at', null)
    .single();

  if (error || !session) return null;
  
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;

  await supabase
    .from('auth_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', session.id);

  return { 
    email: session.email, 
    redirectTo: null
  };
}
