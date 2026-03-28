const { spawnSync } = require("node:child_process");
const path = require("node:path");

function runDeprecatedBaserowWrapper(wrapperName) {
  console.warn(`[deprecated] ${wrapperName} -> npm run baserow:sanitize --`);
  const script = path.join(__dirname, "baserow-sanitize.cjs");
  const run = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  process.exit(run.status ?? 1);
}

module.exports = {
  runDeprecatedBaserowWrapper,
};
