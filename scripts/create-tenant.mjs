#!/usr/bin/env node

/**
 * Script para criar o tenant "receitasbell" no Supabase
 * Execução: node scripts/create-tenant.mjs
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
  console.error(
    '❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.production.local'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTenant() {
  console.log('🚀 Iniciando criação de tenant "receitasbell"...\n');

  try {
    // 1. Verificar se tenant já existe
    console.log('📋 Verificando se tenant já existe...');
    const { data: existingTenant } = await supabase
      .from('organizations')
      .select('id, slug, name')
      .eq('slug', 'receitasbell')
      .maybeSingle();

    if (existingTenant) {
      console.log(`✅ Tenant já existe com ID: ${existingTenant.id}`);
      console.log(`   Slug: ${existingTenant.slug}`);
      console.log(`   Nome: ${existingTenant.name}\n`);
      return existingTenant;
    }

    // 2. Inserir novo tenant
    console.log('➕ Criando novo tenant...');
    const { data: newTenant, error: insertError } = await supabase
      .from('organizations')
      .insert([
        {
          slug: 'receitasbell',
          name: 'Receitas Bell',
          is_active: true,
        },
      ])
      .select('id, slug, name, is_active, created_at')
      .single();

    if (insertError) {
      console.error(`❌ Erro ao inserir tenant: ${insertError.message}`);
      process.exit(1);
    }

    console.log('✅ Tenant criado com sucesso!');
    console.log(`   ID: ${newTenant.id}`);
    console.log(`   Slug: ${newTenant.slug}`);
    console.log(`   Nome: ${newTenant.name}`);
    console.log(`   Ativo: ${newTenant.is_active}`);
    console.log(`   Criado em: ${newTenant.created_at}\n`);

    // 3. Inserir settings padrão
    console.log('⚙️  Inserindo configurações padrão...');
    const settings = [
      { key: 'name', value: JSON.stringify('Receitas Bell') },
      { key: 'description', value: JSON.stringify('Compartilhando receitas deliciosas') },
      { key: 'primary_color', value: JSON.stringify('#f97316') },
    ];

    const { error: settingsError } = await supabase.from('organization_settings').insert(
      settings.map((s) => ({
        organization_id: newTenant.id,
        ...s,
      }))
    );

    if (settingsError) {
      console.warn(`⚠️  Aviso ao inserir settings: ${settingsError.message}`);
    } else {
      console.log('✅ Settings inseridas com sucesso\n');
    }

    // 4. Inserir categorias padrão
    console.log('📁 Inserindo categorias padrão...');
    const categories = [
      {
        slug: 'sobremesas',
        name: 'Sobremesas',
        description: 'Receitas de sobremesas doces',
      },
      {
        slug: 'prato-principal',
        name: 'Prato Principal',
        description: 'Receitas de pratos principais',
      },
      {
        slug: 'bebidas',
        name: 'Bebidas',
        description: 'Bebidas e coquetéis',
      },
    ];

    const { error: categoriesError } = await supabase.from('categories').insert(
      categories.map((c) => ({
        organization_id: newTenant.id,
        ...c,
        is_active: true,
      }))
    );

    if (categoriesError) {
      console.warn(`⚠️  Aviso ao inserir categorias: ${categoriesError.message}`);
    } else {
      console.log('✅ Categorias inseridas com sucesso\n');
    }

    console.log('🎉 Tenant "receitasbell" criado com sucesso!');
    console.log(`\n📝 Próximos passos:`);
    console.log(`   1. Teste a rota: https://receitasbell.mtsferreira.dev/t/receitasbell`);
    console.log(`   2. Verifique se a página carrega sem erro 404`);
    console.log(`   3. Confira se as categorias aparecem na interface\n`);

    return newTenant;
  } catch (error) {
    console.error(`❌ Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

createTenant();
