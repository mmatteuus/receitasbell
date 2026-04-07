import { verifyAdminPasswordHash } from './src/server/auth/passwords.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ixfwvaszmngbyxrdiaha.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Znd2YXN6bW5nYnl4cmRpYWhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgzMzU1NSwiZXhwIjoyMDkwNDA5NTU1fQ.bThSt9Ymo72k5J_VAn6mFTlSi0InaewIbRP7PS1hsyM";

async function verify() {
  const s = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: user } = await s.from('profiles').select('password_hash').eq('email', 'admin@receitasbell.com.br').single();
  
  if (!user || !user.password_hash) {
    console.log("No hash found");
    return;
  }
  
  const match = await verifyAdminPasswordHash('Receitasbell.com', user.password_hash);
  console.log("Password match for 'Receitasbell.com':", match);
}

verify();
