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

    console.log("Criando tabela Users...");
    const tRes = await fetch(`${baseUrl}/api/database/tables/database/${dbId}/`, {
      method: "POST", headers, body: JSON.stringify({ name: "Users" })
    });
    const tData = await tRes.json();
    const tableId = tData.id;
    console.log(`Tabela Users criada com ID: ${tableId}`);

    const fields = [
      { name: "email", type: "text" },
      { name: "username", type: "text" },
      { name: "display_name", type: "text" },
      { name: "role", type: "text" },
      { name: "tenantId", type: "text" },
      { name: "created_at", type: "text" },
      { name: "updated_at", type: "text" }
    ];

    for (const field of fields) {
      await fetch(`${baseUrl}/api/database/fields/table/${tableId}/`, {
        method: "POST", headers, body: JSON.stringify(field)
      });
    }

    console.log("Tabela Users configurada!");
  } catch (err) {
    console.error(err);
  }
}

run();
