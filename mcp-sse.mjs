import https from 'node:https';

const token = "vyJH_TkJd9XrFYZ0kpgSplgkM4YMApaA";
const mcpUrl = "https://app.nocodb.com/mcp/ncr2dyvncxjrzefo";

async function connectMcp() {
  console.log("Conectando ao NocoDB MCP via SSE...");
  
  const response = await fetch(mcpUrl, {
    headers: {
      "xc-mcp-token": token,
      "Accept": "text/event-stream"
    }
  });

  if (!response.ok) {
    console.error("Falha ao conectar:", response.status, await response.text());
    return;
  }

  console.log("Conexão estabelecida! Lendo eventos SSE...");
  let postUrl = "";
  
  // Lê o stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    console.log("CHUNK:", chunk);
    
    if (chunk.includes("event: endpoint")) {
      const lines = chunk.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("data: ")) {
          const endpoint = lines[i].substring(6).trim();
          postUrl = endpoint.startsWith("http") ? endpoint : new URL(endpoint, mcpUrl).href;
          console.log(">>> Endpoint POST recebido:", postUrl);
          await listTools(postUrl);
          process.exit(0);
        }
      }
    }
  }
}

async function listTools(postUrl) {
  const req = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };
  
  const res = await fetch(postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xc-mcp-token": token
    },
    body: JSON.stringify(req)
  });
  
  const data = await res.json();
  console.log("=== FERRAMENTAS DISPONÍVEIS ===");
  if (data.result && data.result.tools) {
    console.log(data.result.tools.map(t => t.name).join("\n"));
  } else {
    console.log(data);
  }
}

connectMcp().catch(console.error);
