#!/usr/bin/env node

/**
 * Script para verificar status do Stripe (Account, Webhooks, etc)
 * Execução: node scripts/check-stripe-status.mjs
 *
 * NOTA: Requer acesso ao Stripe Dashboard via navegador
 * Este script apenas verifica variáveis de ambiente
 */

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

console.log('🔍 VERIFICAÇÃO DE STATUS STRIPE\n');
console.log('═══════════════════════════════════════════════════\n');

// 1. Verificar chaves
console.log('1️⃣  CHAVES STRIPE\n');

const secretKey = envVars.STRIPE_SECRET_KEY || 'NÃO ENCONTRADA';
const pubKey = envVars.STRIPE_PUBLISHABLE_KEY || 'NÃO ENCONTRADA';
const webhookSecret = envVars.STRIPE_WEBHOOK_SECRET || 'NÃO ENCONTRADA';

console.log(`   Secret Key: ${secretKey.substring(0, 20)}...`);
if (secretKey.startsWith('sk_live_')) {
  console.log('   ✅ Status: LIVE MODE');
} else if (secretKey.startsWith('sk_test_')) {
  console.log('   ❌ Status: TEST MODE');
} else {
  console.log('   ⚠️  Status: DESCONHECIDO');
}

console.log(`\n   Publishable Key: ${pubKey.substring(0, 20)}...`);
if (pubKey.startsWith('pk_live_')) {
  console.log('   ✅ Status: LIVE MODE');
} else if (pubKey.startsWith('pk_test_')) {
  console.log('   ❌ Status: TEST MODE');
} else {
  console.log('   ⚠️  Status: DESCONHECIDO');
}

console.log(`\n   Webhook Secret: ${webhookSecret.substring(0, 20)}...`);
if (webhookSecret.startsWith('whsec_')) {
  console.log('   ✅ Status: CONFIGURADO');
} else {
  console.log('   ❌ Status: NÃO CONFIGURADO');
}

// 2. Extrair informações
console.log('\n2️⃣  INFORMAÇÕES EXTRAÍDAS\n');

const secretMatches = secretKey.match(/sk_live_([a-zA-Z0-9]+)/);
const pubMatches = pubKey.match(/pk_live_([a-zA-Z0-9]+)/);

if (secretMatches && pubMatches && secretMatches[1] === pubMatches[1]) {
  console.log(`   ✅ Chaves pareadas corretamente`);
  console.log(`   ID de Stripe: ${secretMatches[1].substring(0, 20)}...`);
} else {
  console.log(`   ⚠️  Chaves pareadas incorretamente`);
}

// 3. Status de redirect
console.log('\n3️⃣  CONFIGURAÇÃO\n');

const redirectUri = envVars.STRIPE_REDIRECT_URI || '(não configurado)';
console.log(`   Redirect URI: ${redirectUri}`);
if (!redirectUri || redirectUri === '(não configurado)') {
  console.log('   ⚠️  Aviso: Redirect URI não configurado');
}

// 4. Resumo
console.log('\n═══════════════════════════════════════════════════\n');
console.log('📊 RESUMO\n');

const isLive = secretKey.startsWith('sk_live_') && pubKey.startsWith('pk_live_');
const webhookConfigured = webhookSecret.startsWith('whsec_');

if (isLive && webhookConfigured) {
  console.log('   ✅ STRIPE EM LIVE MODE COM WEBHOOK CONFIGURADO');
  console.log('\n   Próximos Passos:');
  console.log('   1. Verificar se Account Stripe está "Complete"');
  console.log('   2. Validar Webhook Endpoint está ativo');
  console.log('   3. Testar pagamento real');
} else if (isLive && !webhookConfigured) {
  console.log('   ⚠️  STRIPE EM LIVE MODE MAS WEBHOOK NÃO CONFIGURADO');
  console.log('\n   Ação Necessária:');
  console.log('   1. Configurar Webhook Secret em env vars');
} else {
  console.log('   ❌ STRIPE EM TEST MODE - MIGRAÇÃO NECESSÁRIA');
  console.log('\n   Ação Necessária:');
  console.log('   1. Gerar chaves LIVE no Stripe Dashboard');
  console.log('   2. Atualizar env vars no Vercel');
  console.log('   3. Fazer deploy em produção');
}

console.log('\n📚 Documentação:');
console.log('   - Stripe Dashboard: https://dashboard.stripe.com');
console.log('   - Stripe Webhooks: https://dashboard.stripe.com/webhooks');
console.log('   - Stripe API Keys: https://dashboard.stripe.com/apikeys\n');
