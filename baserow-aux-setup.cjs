const email = "mtsf26@gmail.com";
const password = "4eKPZ2vEwQst4AD";
const baseUrl = "https://api.baserow.io";
const dbId = 399490;

async function run() {
  try {
    const authRes = await fetch(`${baseUrl}/api/user/token-auth/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const authData = await authRes.json();
    const headers = { "Authorization": `JWT ${authData.token}`, "Content-Type": "application/json" };

    const schemas = [
      { name: "Comments", fields: [
        { name: "recipeId", type: "text" },
        { name: "authorName", type: "text" },
        { name: "authorEmail", type: "text" },
        { name: "userId", type: "text" },
        { name: "text", type: "long_text" },
        { name: "tenantId", type: "text" },
        { name: "created_at", type: "text" }
      ]},
      { name: "Favorites", fields: [
        { name: "userId", type: "text" },
        { name: "recipeId", type: "text" },
        { name: "tenantId", type: "text" },
        { name: "created_at", type: "text" }
      ]},
      { name: "Newsletter", fields: [
        { name: "email", type: "text" },
        { name: "tenantId", type: "text" },
        { name: "created_at", type: "text" }
      ]},
      { name: "ShoppingList", fields: [
        { name: "userId", type: "text" },
        { name: "recipeId", type: "text" },
        { name: "items_json", type: "long_text" },
        { name: "tenantId", type: "text" },
        { name: "updated_at", type: "text" }
      ]},
      { name: "Ratings", fields: [
        { name: "recipeId", type: "text" },
        { name: "userId", type: "text" },
        { name: "value", type: "number" },
        { name: "tenantId", type: "text" },
        { name: "updated_at", type: "text" }
      ]},
      { name: "Entitlements", fields: [
        { name: "userId", type: "text" },
        { name: "recipeSlug", type: "text" },
        { name: "paymentId", type: "text" },
        { name: "tenantId", type: "text" },
        { name: "created_at", type: "text" }
      ]}
    ];

    for (const schema of schemas) {
      console.log(`Criando tabela ${schema.name}...`);
      const tRes = await fetch(`${baseUrl}/api/database/tables/database/${dbId}/`, {
        method: "POST", headers, body: JSON.stringify({ name: schema.name })
      });
      const tData = await tRes.json();
      const tableId = tData.id;
      console.log(`Tabela ${schema.name} criada com ID: ${tableId}`);

      for (const field of schema.fields) {
        await fetch(`${baseUrl}/api/database/fields/table/${tableId}/`, {
          method: "POST", headers, body: JSON.stringify(field)
        });
      }
    }

    console.log("Todas as tabelas auxiliares foram criadas!");
  } catch (err) {
    console.error(err);
  }
}

run();
