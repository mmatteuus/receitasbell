#!/usr/bin/env node

/**
 * Script de Validação de Configuração Stripe
 *
 * Verifica se a configuração do Stripe está correta antes de colocar em produção.
 * Executa: npm run validate:stripe
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

interface ValidationResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }>;
}

function loadEnv(envFile: string): Record<string, string> {
  try {
    const content = readFileSync(envFile, 'utf-8');
    const env: Record<string, string> = {};
    content.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key?.trim() && !key.startsWith('#')) {
        env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    });
    return env;
  } catch {
    return {};
  }
}

function validateStripeConfig(): ValidationResult {
  const checks: ValidationResult['checks'] = [];

  // Carregar .env files (local first)
  const envLocal = loadEnv(resolve('.env.local'));
  const envProd = loadEnv(resolve('.env.production.local'));
  const envProcess = process.env;

  const env = { ...envProd, ...envLocal, ...envProcess };

  // ===== CHECK 1: Chaves de API =====
  const secretKey = env.STRIPE_SECRET_KEY || '';
  const publishableKey = env.STRIPE_PUBLISHABLE_KEY || '';
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET || '';

  if (!secretKey) {
    checks.push({
      name: 'STRIPE_SECRET_KEY',
      passed: false,
      severity: 'error',
      message: 'Falta STRIPE_SECRET_KEY em .env',
    });
  } else if (secretKey.startsWith('sk_test_')) {
    checks.push({
      name: 'STRIPE_SECRET_KEY Mode',
      passed: false,
      severity: 'error',
      message: 'STRIPE_SECRET_KEY está em TEST MODE (sk_test_*). Deve ser LIVE (sk_live_*)',
    });
  } else if (secretKey.startsWith('sk_live_')) {
    checks.push({
      name: 'STRIPE_SECRET_KEY Mode',
      passed: true,
      severity: 'info',
      message: 'STRIPE_SECRET_KEY está em LIVE MODE ✓',
    });
  } else {
    checks.push({
      name: 'STRIPE_SECRET_KEY Format',
      passed: false,
      severity: 'error',
      message: `STRIPE_SECRET_KEY tem formato inválido: ${secretKey.substring(0, 20)}...`,
    });
  }

  if (!publishableKey) {
    checks.push({
      name: 'STRIPE_PUBLISHABLE_KEY',
      passed: false,
      severity: 'error',
      message: 'Falta STRIPE_PUBLISHABLE_KEY em .env',
    });
  } else if (publishableKey.startsWith('pk_test_')) {
    checks.push({
      name: 'STRIPE_PUBLISHABLE_KEY Mode',
      passed: false,
      severity: 'error',
      message: 'STRIPE_PUBLISHABLE_KEY está em TEST MODE (pk_test_*). Deve ser LIVE (pk_live_*)',
    });
  } else if (publishableKey.startsWith('pk_live_')) {
    checks.push({
      name: 'STRIPE_PUBLISHABLE_KEY Mode',
      passed: true,
      severity: 'info',
      message: 'STRIPE_PUBLISHABLE_KEY está em LIVE MODE ✓',
    });
  } else {
    checks.push({
      name: 'STRIPE_PUBLISHABLE_KEY Format',
      passed: false,
      severity: 'error',
      message: `STRIPE_PUBLISHABLE_KEY tem formato inválido: ${publishableKey.substring(0, 20)}...`,
    });
  }

  if (!webhookSecret) {
    checks.push({
      name: 'STRIPE_WEBHOOK_SECRET',
      passed: false,
      severity: 'error',
      message: 'Falta STRIPE_WEBHOOK_SECRET em .env (Stripe Dashboard → Webhooks → Signing Secret)',
    });
  } else if (webhookSecret.startsWith('whsec_')) {
    checks.push({
      name: 'STRIPE_WEBHOOK_SECRET Format',
      passed: true,
      severity: 'info',
      message: 'STRIPE_WEBHOOK_SECRET está configurado ✓',
    });
  } else {
    checks.push({
      name: 'STRIPE_WEBHOOK_SECRET Format',
      passed: false,
      severity: 'error',
      message: `STRIPE_WEBHOOK_SECRET tem formato inválido (esperado whsec_*): ${webhookSecret.substring(0, 20)}...`,
    });
  }

  // ===== CHECK 2: Verificar se há mistura de TEST e LIVE =====
  const hasTestKeys = secretKey?.startsWith('sk_test_') || publishableKey?.startsWith('pk_test_');
  const hasLiveKeys = secretKey?.startsWith('sk_live_') || publishableKey?.startsWith('pk_live_');

  if (hasTestKeys && hasLiveKeys) {
    checks.push({
      name: 'Mode Consistency',
      passed: false,
      severity: 'error',
      message: 'Detectada mistura de chaves TEST e LIVE. Ambiente inconsistente!',
    });
  }

  // ===== CHECK 3: Verificar se arquivo .env.production.local existe =====
  try {
    readFileSync(resolve('.env.production.local'), 'utf-8');
    checks.push({
      name: '.env.production.local',
      passed: true,
      severity: 'info',
      message: '.env.production.local existe ✓',
    });
  } catch {
    checks.push({
      name: '.env.production.local',
      passed: false,
      severity: 'warning',
      message: '.env.production.local não encontrado. Chaves podem estar em outro arquivo.',
    });
  }

  // ===== CHECK 4: Verificar se webhook handler existe =====
  try {
    readFileSync(
      resolve('src/server/payments/application/handlers/webhooks/stripe.ts'),
      'utf-8'
    );
    checks.push({
      name: 'Webhook Handler',
      passed: true,
      severity: 'info',
      message: 'Handler webhook Stripe implementado ✓',
    });
  } catch {
    checks.push({
      name: 'Webhook Handler',
      passed: false,
      severity: 'error',
      message: 'Webhook handler não encontrado em src/server/payments/application/handlers/webhooks/stripe.ts',
    });
  }

  // ===== RESULTADO =====
  const allPassed = checks.every((c) => c.passed || c.severity === 'warning');

  return {
    passed: allPassed,
    checks,
  };
}

function printResults(result: ValidationResult): void {
  console.log('\n=====================================');
  console.log('🔍 VALIDAÇÃO DE CONFIGURAÇÃO STRIPE');
  console.log('=====================================\n');

  const errorChecks = result.checks.filter((c) => c.severity === 'error');
  const warningChecks = result.checks.filter((c) => c.severity === 'warning');
  const infoChecks = result.checks.filter((c) => c.severity === 'info');

  if (errorChecks.length > 0) {
    console.log('❌ ERROS (CRÍTICO):');
    errorChecks.forEach((c) => {
      console.log(`  • ${c.name}: ${c.message}`);
    });
    console.log();
  }

  if (warningChecks.length > 0) {
    console.log('⚠️  AVISOS (não bloqueante):');
    warningChecks.forEach((c) => {
      console.log(`  • ${c.name}: ${c.message}`);
    });
    console.log();
  }

  if (infoChecks.length > 0) {
    console.log('ℹ️  INFORMAÇÃO:');
    infoChecks.forEach((c) => {
      console.log(`  • ${c.name}: ${c.message}`);
    });
    console.log();
  }

  if (result.passed) {
    console.log('✅ RESULTADO: Configuração válida para produção\n');
    process.exit(0);
  } else {
    console.log('❌ RESULTADO: Erros críticos encontrados. Veja acima.\n');
    console.log('📌 PRÓXIMOS PASSOS:');
    console.log('  1. Copiar chaves LIVE do Stripe Dashboard');
    console.log('  2. Atualizar .env.production.local');
    console.log('  3. Verificar webhook secret em Stripe → Webhooks → Signing Secret\n');
    process.exit(1);
  }
}

// Executar validação
const result = validateStripeConfig();
printResults(result);
