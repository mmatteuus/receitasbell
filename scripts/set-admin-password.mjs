#!/usr/bin/env node

import { randomBytes, scryptSync } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const MIN_ADMIN_PASSWORD_LENGTH = 10;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

const COMMON_WEAK_PASSWORDS = new Set([
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password123',
  'admin',
  'admin123',
  'qwerty',
  'qwerty123',
  'abc123',
  'letmein',
]);

function getAdminPasswordStrengthIssues(password) {
  const value = String(password || '');
  const issues = [];

  if (value.length < MIN_ADMIN_PASSWORD_LENGTH) {
    issues.push(`A senha deve ter no mínimo ${MIN_ADMIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (/\s/.test(value)) {
    issues.push('A senha não pode conter espaços.');
  }

  const classes = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
  if (classes < 3) {
    issues.push(
      'A senha deve combinar pelo menos 3 tipos: minúsculas, maiúsculas, números e símbolos.'
    );
  }
  if (/(.)\1{3,}/.test(value)) {
    issues.push('A senha não pode ter repetições longas do mesmo caractere.');
  }
  if (COMMON_WEAK_PASSWORDS.has(value.toLowerCase())) {
    issues.push('A senha informada está na lista de credenciais fracas.');
  }

  return issues;
}

function assertStrongAdminPassword(password, fieldLabel = 'password') {
  const issues = getAdminPasswordStrengthIssues(password);
  if (issues.length > 0) {
    const details = issues.map((issue) => `- ${issue}`).join('\n');
    throw new Error(`Credencial fraca para ${fieldLabel}.\n${details}`);
  }
}

function hashAdminPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return [
    'scrypt',
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

async function run() {
  const userId = String(process.env.ADMIN_USER_ID || '').trim();
  const password = String(process.env.ADMIN_NEW_PASSWORD || '').trim();
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const supabaseKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!userId || !password) {
    throw new Error('ADMIN_USER_ID e ADMIN_NEW_PASSWORD obrigatorios.');
  }
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL obrigatorio.');
  }
  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY obrigatorio.');
  }

  assertStrongAdminPassword(password, 'ADMIN_NEW_PASSWORD');
  const passwordHash = hashAdminPassword(password);

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  console.log('admin password updated');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
