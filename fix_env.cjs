const fs = require('fs');
const { spawnSync, execSync } = require('child_process');

const content = fs.readFileSync('.env.production.local', 'utf-8');
const lines = content.split(/\r?\n/);

const keysToFix = [
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'UPSTASH_REDIS_REST_TOKEN',
  'UPSTASH_REDIS_REST_URL'
];

console.log('Fixing Vercel environment variables...');

lines.forEach(line => {
  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) return;
  const key = line.substring(0, eqIdx).trim();
  let val = line.substring(eqIdx + 1).trim();

  if (keysToFix.includes(key)) {
    // Clean up literal \n and quotes
    val = val.replace(/\\n/g, '').replace(/^"|"/g, '').trim();
    
    console.log(`Removing ${key}...`);
    try {
      execSync(`npx vercel env rm ${key} production -y`);
      execSync(`npx vercel env rm ${key} preview -y`);
      execSync(`npx vercel env rm ${key} development -y`);
    } catch(e) {}
    
    console.log(`Adding ${key}... (length: ${val.length})`);
    
    // Vercel env add doesn't let us easily target multiple envs from stdin if it asks for them interactively
    // It's easiest to add one by one. But wait, `vercel env add KEY [environment]`
    const res = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production'], { 
      input: val,
      encoding: 'utf-8' 
    });
    
    if (res.status === 0) {
      console.log(`Successly updated ${key}.`);
    } else {
      console.error(`Failed to update ${key}:`, res.stderr, res.stdout);
    }
  }
});
console.log('Done mapping keys.');
