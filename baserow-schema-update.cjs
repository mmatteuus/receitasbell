const email = "mtsf26@gmail.com";
const password = "4eKPZ2vEwQst4AD";
const baseUrl = "https://api.baserow.io";

const TABLES = {
  TENANTS: 896975,
  SETTINGS: 896976,
  CATEGORIES: 896977,
  RECIPES: 896978,
  PAYMENTS: 896979,
};

async function run() {
  try {
    const authRes = await fetch(`${baseUrl}/api/user/token-auth/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const authData = await authRes.json();
    const headers = { "Authorization": `JWT ${authData.token}`, "Content-Type": "application/json" };

    async function addFields(tableId, fields) {
      console.log(`Adding fields to table ${tableId}...`);
      for (const field of fields) {
        const res = await fetch(`${baseUrl}/api/database/fields/table/${tableId}/`, {
          method: "POST", headers, body: JSON.stringify(field)
        });
        if (res.ok) console.log(`  Field ${field.name} added.`);
        else console.log(`  Failed to add ${field.name}: ${await res.text()}`);
      }
    }

    await addFields(TABLES.RECIPES, [
      { name: "tags_json", type: "long_text" },
      { name: "prep_time", type: "number" },
      { name: "cook_time", type: "number" },
      { name: "total_time", type: "number" },
      { name: "servings", type: "number" },
      { name: "access_tier", type: "text" },
      { name: "price_brl", type: "number" },
      { name: "full_ingredients_json", type: "long_text" },
      { name: "full_instructions_json", type: "long_text" },
      { name: "is_featured", type: "boolean" },
      { name: "excerpt", type: "long_text" },
      { name: "seo_title", type: "text" },
      { name: "seo_description", type: "long_text" },
      { name: "image_file_meta_json", type: "long_text" },
      { name: "status", type: "text" },
      { name: "published_at", type: "text" },
      { name: "created_at", type: "text" },
      { name: "updated_at", type: "text" },
      { name: "created_by_user_id", type: "text" }
    ]);

    await addFields(TABLES.CATEGORIES, [
      { name: "slug", type: "text" },
      { name: "description", type: "long_text" },
      { name: "created_at", type: "text" },
      { name: "updated_at", type: "text" }
    ]);

    await addFields(TABLES.PAYMENTS, [
      { name: "created_at", type: "text" },
      { name: "updated_at", type: "text" }
    ]);

    console.log("Schema update complete!");
  } catch (err) {
    console.error(err);
  }
}

run();
