#!/usr/bin/env node

/**
 * Redefine a senha de um usuário administrativo no Supabase.
 *
 * Exemplo:
 * node --env-file=.env.production.local scripts/reset-admin-password.mjs
 *
 * Variáveis obrigatórias:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ADMIN_PASSWORD
 *
 * Variável opcional:
 * - ADMIN_EMAIL (padrão: admin@receitasbell.com)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@receitasbell.com')
  .trim()
  .toLowerCase();
const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();

if (!supabaseUrl || !serviceRoleKey || !adminPassword) {
  console.error(
    'Variáveis obrigatórias ausentes: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e ADMIN_PASSWORD.'
  );
  process.exit(1);
}

if (adminPassword.length < 12) {
  console.error('ADMIN_PASSWORD deve possuir pelo menos 12 caracteres.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function resetAdminPassword() {
  console.log(`Buscando usuário administrativo: ${adminEmail}`);

  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers();

  if (listError) {
    throw new Error(`Falha ao listar usuários: ${listError.message}`);
  }

  const adminUser = users.find((user) => user.email?.toLowerCase() === adminEmail);

  if (!adminUser) {
    throw new Error(`Usuário administrativo não encontrado: ${adminEmail}`);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
    password: adminPassword,
  });

  if (updateError) {
    throw new Error(`Falha ao atualizar a senha: ${updateError.message}`);
  }

  console.log('Senha administrativa atualizada com sucesso.');
}

resetAdminPassword().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
