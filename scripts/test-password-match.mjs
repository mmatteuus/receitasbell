import { scryptSync, timingSafeEqual } from "node:crypto";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function test() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profile } = await supabase
    .from('profiles')
    .select('password_hash')
    .eq('email', 'admin@receitasbell.com')
    .single();

  if (!profile || !profile.password_hash) {
    console.log("Profile not found");
    return;
  }

  const storedHash = profile.password_hash;
  const parts = storedHash.split("$");
  const [algo, nRaw, rRaw, pRaw, saltRaw, digestRaw] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  const salt = Buffer.from(saltRaw, "base64url");
  const expected = Buffer.from(digestRaw, "base64url");
  const computed = scryptSync(ADMIN_PASSWORD, salt, expected.length, { N, r, p });

  const ok = timingSafeEqual(expected, computed);
  console.log(JSON.stringify({ 
    storedHash, 
    passwordUsed: ADMIN_PASSWORD.substring(0, 3) + "...",
    isMatch: ok 
  }, null, 2));
}

test();
