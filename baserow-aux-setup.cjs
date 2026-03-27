const { spawnSync } = require("node:child_process");
const path = require("node:path");

console.warn("[deprecated] baserow-aux-setup.cjs -> scripts/baserow-sanitize.cjs");
const script = path.join(__dirname, "scripts", "baserow-sanitize.cjs");
const run = spawnSync(process.execPath, [script, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(run.status ?? 1);
