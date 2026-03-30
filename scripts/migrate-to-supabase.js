
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASEROW_TOKEN = process.env.BASEROW_API_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY || !BASEROW_TOKEN) {
  console.error("Missing credentials!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchFromBaserow(tableId) {
  const url = `https://api.baserow.io/api/database/rows/table/${tableId}/?user_field_names=true`;
  const res = await fetch(url, {
    headers: { Authorization: `Token ${BASEROW_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Baserow error: ${res.statusText}`);
  const data = await res.json();
  return data.results;
}

async function migrate() {
  console.log("🚀 Starting Migration...");

  // 1. TENANTS -> organizations
  console.log("Migrating Tenants...");
  const tenants = await fetchFromBaserow(process.env.BASEROW_TABLE_TENANTS);
  for (const t of tenants) {
    const { data, error } = await supabase.from('organizations').upsert({
      id: t.uuid || t.id, // Using existing ID or UUID
      name: t.name || t.Name,
      slug: t.slug || t.Slug,
      host: t.host || t.Host,
      is_active: true
    }, { onConflict: 'slug' }).select();
    if (error) console.error("Error migrating tenant:", error);
  }

  // 2. CATEGORIES -> categories
  console.log("Migrating Categories...");
  const categories = await fetchFromBaserow(process.env.BASEROW_TABLE_CATEGORIES);
  for (const c of categories) {
    const tenantId = c.tenantId || c.tenant_id;
    if (!tenantId) continue;
    await supabase.from('categories').upsert({
      name: c.name || c.Name,
      icon: c.icon || c.Icon,
      tenant_id: tenantId
    });
  }

  // 3. RECIPES -> recipes
  console.log("Migrating Recipes...");
  const recipes = await fetchFromBaserow(process.env.BASEROW_TABLE_RECIPES);
  for (const r of recipes) {
    const tenantId = r.tenantId || r.tenant_id;
    if (!tenantId) continue;
    
    // Simplificando inserção para o MVP de migração
    await supabase.from('recipes').upsert({
      tenant_id: tenantId,
      title: r.title || r.Title,
      slug: r.slug || r.Slug,
      description: r.description || "",
      instructions_text: r.instructions || r.instructions_text || "",
      status: (r.status || "").toLowerCase() === 'published' ? 'published' : 'draft',
      is_active: true,
      is_public: true
    });
  }

  console.log("✅ Migration Plan Finished (Base tables).");
}

migrate().catch(console.error);
