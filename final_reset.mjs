import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const SUPABASE_URL = "https://ixfwvaszmngbyxrdiaha.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Znd2YXN6bW5nYnl4cmRpYWhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgzMzU1NSwiZXhwIjoyMDkwNDA5NTU1fQ.bThSt9Ymo72k5J_VAn6mFTlSi0InaewIbRP7PS1hsyM";

const scrypt = promisify(crypto.scrypt);

async function hashAdminPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyAdminPasswordHash(password, hash) {
  const [type, N, r, p, salt, key] = hash.split('$');
  if (type !== 'scrypt') return false;
  const derivedKey = await scrypt(password, salt, 64, { N: parseInt(N), r: parseInt(r), p: parseInt(p) });
  return derivedKey.toString('hex') === key;
}

async function start() {
    const s = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const email = 'admin@receitasbell.com.br';
    const newPassword = 'Receitasbell.com';

    console.log(`Resetando para: ${email}`);

    const { data: profile } = await s.from('profiles').select('*').eq('email', email).single();
    if (!profile) {
        console.error("Profile not found");
        return;
    }

    const passwordHash = await hashAdminPassword(newPassword);
    
    // Update Profile
    const { error: pErr } = await s.from('profiles').update({ 
        password_hash: passwordHash,
        is_active: true,
        role: 'owner'
    }).eq('id', profile.id);
    
    if (pErr) {
        console.error("Error updating profile:", pErr);
        return;
    }
    console.log("Profile hash updated.");

    // Update Auth
    const { error: aErr } = await s.auth.admin.updateUserById(profile.id, {
        password: newPassword
    });
    
    if (aErr) {
        console.warn("Auth update failed (might be expected if email is not in auth):", aErr.message);
    } else {
        console.log("Auth password updated.");
    }

    // FINAL VERIFICATION
    const { data: finalProfile } = await s.from('profiles').select('password_hash').eq('id', profile.id).single();
    const isMatch = await verifyAdminPasswordHash(newPassword, finalProfile.password_hash);
    console.log(`VERIFICAÇÃO FINAL: A senha '${newPassword}' combina com o hash no banco? ${isMatch ? 'SIM' : 'NÃO'}`);
}

start();
