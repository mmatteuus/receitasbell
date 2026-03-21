import { spawn } from 'child_process';

const mcp = spawn('npx.cmd', [
  '-y',
  '@nocodb/mcp-remote',
  '--header',
  'xc-mcp-token: vyJH_TkJd9XrFYZ0kpgSplgkM4YMApaA',
  'https://app.nocodb.com/mcp/ncr2dyvncxjrzefo'
]);

let output = '';

mcp.stdout.on('data', (data) => {
  output += data.toString();
  try {
    const lines = output.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      const json = JSON.parse(line);
      if (json.id === 1) {
        console.log("=== MCP TOOLS ===");
        if (json.result && json.result.tools) {
          json.result.tools.forEach(t => console.log(t.name));
        }
        process.exit(0);
      }
    }
  } catch (e) {
    // wait for more data
  }
});

mcp.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

mcp.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

// Send initialization and tools/list
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
