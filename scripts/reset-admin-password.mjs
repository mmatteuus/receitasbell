#!/usr/bin/env node

/**
 * Script para resetar senha do admin via Supabase
 * Execução: node scripts/reset-admin-password.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Ler arquivo .env.production.local
const envPath = join('.', '.env.production.local');
const envContent = readFileSync(envPath, 'utf-8');

// Parsear variáveis de ambiente
const envVars = {};
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');
    envVars[key.trim()] = value;
  }
});

const SUPABASE_URL = envVars.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetAdminPassword() {
  console.log('🚀 Iniciando reset de senha do admin...\n');

  try {
    const adminEmail = 'admin@receitasbell.com';
    const newPassword = 'Receitasbell.com';

    // 1. Buscar usuário admin
    console.log('📋 Buscando usuário admin...');
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error(`❌ Erro ao listar usuários: ${listError.message}`);
      process.exit(1);
    }

    const adminUser = users.find((u) => u.email === adminEmail);

    if (!adminUser) {
      console.error(`❌ Usuário ${adminEmail} não encontrado`);
      console.log('\n📝 Usuários encontrados:');
      users.forEach((u) => console.log(`   - ${u.email}`));
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado: ${adminUser.email}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Criado em: ${adminUser.created_at}\n`);

    // 2. Resetar senha
    console.log(`🔑 Resetando senha para: ${newPassword}`);
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error(`❌ Erro ao resetar senha: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`✅ Senha resetada com sucesso!\n`);

    // 3. Instruções de teste
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log(`   1. Abra a página de login: https://receitasbell.mtsferreira.dev/admin/login`);
    console.log(`   2. Faça login com:`);
    console.log(`      • Email: ${adminEmail}`);
    console.log(`      • Senha: ${newPassword}`);
    console.log(`   3. Após login bem-sucedido, considere trocar a senha por uma mais segura\n`);

    // 4. Verificar perfil admin
    console.log('🔍 Verificando perfil admin no banco...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', adminEmail)
      .maybeSingle();

    if (profileError) {
      console.warn(`⚠️  Aviso ao verificar perfil: ${profileError.message}`);
    } else if (profile) {
      console.log(`✅ Perfil encontrado:`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}\n`);
    }

    console.log('🎉 Reset de senha concluído com sucesso!');
    return true;
  } catch (error) {
    console.error(`❌ Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

resetAdminPassword();
