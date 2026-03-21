const { spawn } = require('child_process');

const mcp = spawn('npx.cmd', [
  '-y',
  'mcp-remote',
  'https://app.nocodb.com/mcp/ncr2dyvncxjrzefo',
  '--header',
  'xc-mcp-token: _eVGBZjpr37bG4DIuVJiDEtdxJdAkWB6'
], { shell: true });

let output = '';

mcp.stdout.on('data', (data) => {
  const chunk = data.toString();
  output += chunk;
  
  // Imprime sem os prefixos chatos de debug do mcp-remote
  if (!chunk.startsWith('[')) {
    console.log("STDOUT:", chunk);
  } else {
    console.log(chunk.trim());
  }

  try {
    const lines = output.split('\n');
    for (const line of lines) {
      if (!line.trim() || line.startsWith('[')) continue;
      
      try {
        const json = JSON.parse(line);
        if (json.id === 1) {
          console.log("\n=== MCP TOOLS ===");
          if (json.result && json.result.tools) {
            json.result.tools.forEach(t => console.log(t.name));
          } else {
            console.log("No tools found in result.", json);
          }
          process.exit(0);
        }
      } catch (e) {
        // Not JSON
      }
    }
  } catch (e) {}
});

mcp.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

mcp.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});

setTimeout(() => {
  console.log("\nEnviando requests...");
  
  const initReq = {
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test", version: "1.0" }
    }
  };

  const toolsReq = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };

  mcp.stdin.write(JSON.stringify(initReq) + '\n');
  mcp.stdin.write(JSON.stringify(toolsReq) + '\n');
}, 3000);
