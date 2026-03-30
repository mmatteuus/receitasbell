import { supabaseAdmin } from "../integrations/supabase/client.js";

export interface TenantRecord {
  id: string; // Migrado para UUID
  slug: string;
  name: string;
  host?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export async function getTenantBySlug(slug: string): Promise<TenantRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapOrganizationToRecord(data);
}

export async function getTenantById(id: string): Promise<TenantRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return mapOrganizationToRecord(data);
}

export async function getTenantByHost(host: string): Promise<TenantRecord | null> {
  const normalized = host.trim().toLowerCase().replace(/:\d+$/, "");
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('host', normalized)
    .maybeSingle();

  if (error || !data) return null;
  return mapOrganizationToRecord(data);
}

export async function listActiveTenants(): Promise<TenantRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('is_active', true);

  if (error || !data) return [];
  return data.map(mapOrganizationToRecord);
}

export async function countTenants(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  return count ?? 0;
}

export async function createTenant(input: {
  slug: string;
  name: string;
  host?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .insert({
      slug: input.slug,
      name: input.name,
      host: input.host || "",
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return mapOrganizationToRecord(data);
}

function mapOrganizationToRecord(row: any): TenantRecord {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    host: row.host || "",
    status: row.is_active ? "active" : "inactive",
    createdAt: row.created_at || "",
  };
}
