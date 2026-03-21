const email = "mtsf26@gmail.com";
const password = "4eKPZ2vEwQst4AD";
const baseUrl = "https://api.baserow.io";
const tableId = 896975; // Tenants Table

async function run() {
  try {
    const authRes = await fetch(`${baseUrl}/api/user/token-auth/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const authData = await authRes.json();
    const headers = { "Authorization": `JWT ${authData.token}`, "Content-Type": "application/json" };

    console.log("Adding 'host' field to Tenants table...");
    await fetch(`${baseUrl}/api/database/fields/table/${tableId}/`, {
      method: "POST", headers, body: JSON.stringify({ name: "host", type: "text" })
    });

    console.log("Done!");
  } catch (err) {
    console.error(err);
  }
}

run();
