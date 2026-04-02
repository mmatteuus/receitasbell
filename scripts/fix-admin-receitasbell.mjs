#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { randomBytes, scryptSync } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@receitasbell.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TENANT_SLUG = (process.env.TENANT_SLUG || 'receitasbell').trim().toLowerCase();
const ADMIN_NAME = (process.env.ADMIN_NAME || 'Admin Receitas Bell').trim();
const ADMIN_ROLE = (process.env.ADMIN_ROLE || 'owner').trim().toLowerCase();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}
if (!ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_PASSWORD.');
}
if (!['admin', 'owner'].includes(ADMIN_ROLE)) {
  throw new Error('ADMIN_ROLE must be admin or owner.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function hashAdminPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return [
    'scrypt',
    '16384',
    '8',
    '1',
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

async function ensureAuthUser(email, password) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const existing = data.users.find((user) => (user.email || '').toLowerCase() === email);
    if (existing) {
      const updated = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_NAME },
      });
      if (updated.error || !updated.data.user) {
        throw updated.error || new Error('Failed to update auth user.');
      }
      return updated.data.user;
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  if (created.error || !created.data.user) {
    throw created.error || new Error('Failed to create auth user.');
  }

  return created.data.user;
}

async function main() {
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('organizations')
    .select('id, slug, name')
    .eq('slug', TENANT_SLUG)
    .single();

  if (tenantError || !tenant) {
    throw tenantError || new Error('Tenant not found.');
  }

  const authUser = await ensureAuthUser(ADMIN_EMAIL, ADMIN_PASSWORD);
  const passwordHash = hashAdminPassword(ADMIN_PASSWORD);
  const username = ADMIN_EMAIL.split('@')[0];

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
    {
      id: authUser.id,
      organization_id: tenant.id,
      email: ADMIN_EMAIL,
      username,
      display_name: ADMIN_NAME,
      full_name: ADMIN_NAME,
      role: ADMIN_ROLE,
      is_active: true,
      password_hash: passwordHash,
      legacy_password: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) throw profileError;

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        userId: authUser.id,
        email: authUser.email,
        role: ADMIN_ROLE,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
