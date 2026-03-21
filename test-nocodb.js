const token = "vyJH_TkJd9XrFYZ0kpgSplgkM4YMApaA";
const baseUrl = "https://app.nocodb.com";
const baseId = "ncr2dyvncxjrzefo";

async function run() {
  try {
    // Tenta usar xc-token e se falhar xc-auth
    let res = await fetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, {
      headers: { "xc-token": token }
    });
    
    if (res.status === 401 || res.status === 403) {
      console.log("xc-token auth failed, trying xc-auth...");
      res = await fetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, {
        headers: { "xc-auth": token }
      });
    }

    if (!res.ok) {
      console.log("Error fetching tables:", res.status, await res.text());
      return;
    }
    
    const data = await res.json();
    console.log(`=== TABELAS DA BASE ${baseId} ===`);
    const tables = data.list || [];
    
    for (const table of tables) {
      console.log(`- ${table.title} (ID: ${table.id})`);
      
      const colsRes = await fetch(`${baseUrl}/api/v2/meta/tables/${table.id}/columns`, {
        headers: { "xc-token": token }
      });
      if (colsRes.ok) {
        const colsData = await colsRes.json();
        const colNames = (colsData.list || []).map(c => `${c.title} (${c.uid})`).join(", ");
        console.log(`  Colunas: ${colNames}`);
      } else {
        // tenta com xc-auth
        const colsRes2 = await fetch(`${baseUrl}/api/v2/meta/tables/${table.id}/columns`, {
          headers: { "xc-auth": token }
        });
        if (colsRes2.ok) {
          const colsData = await colsRes2.json();
          const colNames = (colsData.list || []).map(c => `${c.title} (${c.uid})`).join(", ");
          console.log(`  Colunas: ${colNames}`);
        }
      }
    }
    
    if (tables.length === 0) console.log(data);
    
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
