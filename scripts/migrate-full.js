
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASEROW_TOKEN = process.env.BASEROW_API_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function toUUID(id) {
    if (!id) return null;
    return uuidv5(String(id), NAMESPACE);
}

async function fetchAll(tableId) {
    if (!tableId) return [];
    const url = `https://api.baserow.io/api/database/rows/table/${tableId}/?user_field_names=true`;
    const res = await fetch(url, { headers: { Authorization: `Token ${BASEROW_TOKEN}` } });
    const j = await res.json();
    return j.results || [];
}

async function run() {
    console.log("🚀 MIGRATION RELATIONAL (V7 FINAL)");

    // 1. CATEGORIES (First)
    console.log("-> Syncing Categories...");
    const cats = await fetchAll(process.env.BASEROW_TABLE_CATEGORIES);
    for (const c of cats) {
        const guid = toUUID(c.id);
        const tenantRaw = Array.isArray(c.tenantId) ? c.tenantId[0]?.id : (c.tenantId || 34);
        const tenantGuid = toUUID(tenantRaw);
        
        await supabase.from('categories').upsert({
            id: guid,
            tenant_id: tenantGuid,
            name: c.name || c.Name || 'Nova Categoria',
            icon: c.icon || 'chef-hat'
        });
    }

    // 2. RECIPES
    console.log("-> Syncing Recipes...");
    const recipes = await fetchAll(process.env.BASEROW_TABLE_RECIPES);
    for (const r of recipes) {
        const guid = toUUID(r.id);
        const tenantRaw = Array.isArray(r.tenantId) ? r.tenantId[0]?.id : (r.tenantId || 34);
        const tenantGuid = toUUID(tenantRaw);
        
        // Link Category
        let catGuid = null;
        if (r.categoryId?.[0]?.id) catGuid = toUUID(r.categoryId[0].id);
        else if (r.categoryId) catGuid = toUUID(r.categoryId);

        console.log(`   Upserting recipe: ${r.title}`);
        const { error } = await supabase.from('recipes').upsert({
            id: guid,
            tenant_id: tenantGuid,
            category_id: catGuid,
            title: r.title || 'Sem Título',
            slug: r.slug || guid,
            description: r.description || '',
            instructions_text: r.instructions_text || r.instructions || '',
            image_url: r.image?.[0]?.url || null,
            kcal: r.kcal || null,
            prep_time_min: r.prep_time || null,
            cook_time_min: r.cook_time || null,
            total_time_min: r.total_time || null,
            servings: r.servings || null,
            price_brl: r.price_brl || 0,
            status: 'published',
            is_active: true,
            is_public: true
        });
        if (error) console.error("   ❌ ERR recipe:", error.message);
        else console.log("   ✅ Success");
    }

    console.log("\n✅ ALL DATA MIGRATED TO SUPABASE!");
}

run().catch(console.error);
