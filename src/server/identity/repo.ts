import { supabase } from "../integrations/supabase/client.js";

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  status: "active" | "inactive";
  tenantId: string;
  passwordHash?: string;
  legacyPassword?: string;
  createdAt: string;
  updatedAt: string;
}

function mapProfileToRecord(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email,
    username: row.username || "",
    displayName: row.display_name || "",
    role: row.role || "member",
    status: row.is_active ? "active" : "inactive",
    tenantId: row.organization_id || "",
    passwordHash: row.password_hash || "",
    legacyPassword: row.legacy_password || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createUser(input: {
  tenantId: string;
  email: string;
  displayName?: string;
  role?: string;
  status?: "active" | "inactive";
  passwordHash?: string; // Nota: Para Supabase Auth, isso seria tratado via API de Admin
}): Promise<UserRecord> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      email: input.email.toLowerCase(),
      organization_id: input.tenantId,
      display_name: input.displayName || input.email.split('@')[0],
      username: input.email.split('@')[0],
      role: input.role || 'member',
      is_active: input.status !== 'inactive',
    })
    .select()
    .single();

  if (error || !data) throw error;
  return mapProfileToRecord(data);
}

export async function findUserByEmailForTenant(
  tenant: { id: string; slug: string; name: string },
  email: string,
): Promise<UserRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('organization_id', tenant.id)
    .single();

  if (error || !data) return null;
  return mapProfileToRecord(data);
}

export async function findOrCreateUserByEmail(organizationId: string, email: string, displayName?: string): Promise<UserRecord> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('organization_id', organizationId)
    .single();

  if (existing) return mapProfileToRecord(existing);

  // Nota: Perfis são geralmente criados via trigger no Supabase Auth.
  // Aqui fazemos um upsert preventivo ou manual se necessário.
  const { data: created, error } = await supabase
    .from('profiles')
    .upsert({
      email: email.toLowerCase(),
      organization_id: organizationId,
      display_name: displayName || email.split('@')[0],
      username: email.split('@')[0],
    }, { onConflict: 'email' })
    .select()
    .single();

  if (error || !created) throw new Error(`Erro ao criar perfil: ${error?.message}`);
  return mapProfileToRecord(created);
}

export async function updateUserProfile(userId: string, updates: Partial<UserRecord>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: updates.displayName,
      role: updates.role,
      is_active: updates.status === 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapProfileToRecord(data);
}

export async function updateUserPasswordCredentials(input: {
  userId: string;
  passwordHash: string;
  legacyPassword?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      password_hash: input.passwordHash,
      legacy_password: input.legacyPassword || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.userId)
    .select()
    .single();

  if (error) throw error;
  return mapProfileToRecord(data);
}
