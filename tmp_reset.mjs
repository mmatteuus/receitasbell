
import { createClient } from '@supabase/supabase-js';
import { randomBytes, scryptSync } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = 'admin@receitasbell.com.br';
const password = 'Receitasbell.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function hashPassword(pass) {
  const salt = randomBytes(16);
  const derived = scryptSync(pass, salt, 64, { N: 16384, r: 8, p: 1 });
  return [
    'scrypt',
    '16384',
    '8',
    '1',
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

async function run() {
  console.log('Resetting for:', email);
  
  const hash = hashPassword(password);
  
  // 1. Find the user in auth.users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('User not found in auth.users');
    return;
  }
  
  console.log('User ID:', user.id);
  
  // 2. Update auth password
  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    password: password,
    email_confirm: true
  });
  if (authError) throw authError;
  console.log('Auth password updated');
  
  // 3. Update profile hash
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      password_hash: hash,
      is_active: true,
      role: 'owner'
    })
    .eq('id', user.id);
    
  if (profileError) throw profileError;
  console.log('Profile hash updated');
  
  console.log('All done. Credentials should be valid now.');
}

run().catch(console.error);
