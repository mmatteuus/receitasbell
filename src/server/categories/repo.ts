import { supabase, supabaseAdmin } from "../integrations/supabase/client.js";

type CategoryRow = {
  id: string | number;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  tenant_id: string | number;
};

export interface Category {
  id: string | number;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  tenantId: string | number;
}

export async function listCategories(tenantId: string | number): Promise<Category[]> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) return [];
  return (data || []).map(mapCategoryRowToRecord);
}

export async function getCategoryBySlug(tenantId: string | number, slug: string): Promise<Category | null> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapCategoryRowToRecord(data);
}

export async function createCategory(tenantId: string | number, input: { name: string; slug: string; description?: string }): Promise<Category> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      tenant_id: tenantId,
      name: input.name,
      slug: input.slug,
      description: input.description || "",
    })
    .select()
    .single();

  if (error) throw error;
  return mapCategoryRowToRecord(data);
}

export async function updateCategory(tenantId: string | number, id: string | number, input: Partial<{ name: string; slug: string; description: string }>): Promise<Category> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .update({
        ...input,
        updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) throw error;
  return mapCategoryRowToRecord(data);
}

export async function deleteCategory(tenantId: string | number, id: string | number): Promise<void> {
  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) throw error;
}

function mapCategoryRowToRecord(record: CategoryRow): Category {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description || "",
    icon: record.icon || undefined,
    createdAt: record.created_at,
    tenantId: String(record.tenant_id),
  };
}
