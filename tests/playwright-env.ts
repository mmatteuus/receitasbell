import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(content: string) {
  const entries: Array<[string, string]> = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    const normalized =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1)
        : value;

    entries.push([key, normalized]);
  }

  return entries;
}

export function loadPlaywrightEnv() {
  if (process.env.PLAYWRIGHT_DISABLE_LOCAL_ENV === '1') {
    return;
  }

  const filePath = path.resolve(process.cwd(), '.env.playwright.local');
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of parseEnvFile(content)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadPlaywrightEnv();
