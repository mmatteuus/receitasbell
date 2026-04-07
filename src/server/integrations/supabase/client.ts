import { createClient } from '@supabase/supabase-js';
import type { SupabaseClientOptions } from '@supabase/supabase-js';
import { env } from '../../shared/env.js';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Certifique-se de configurar as variáveis de ambiente.'
  );
}

/**
 * Configuração global com timeout para o Supabase
 */
const supabaseOptions: SupabaseClientOptions<'public'> = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (input: string | Request, init?: RequestInit) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      return fetch(input, { ...init, signal: controller.signal }).finally(() =>
        clearTimeout(timeoutId)
      );
    },
  },
};

/**
 * Cliente admin do Supabase (ignora RLS)
 * Use este para tarefas de sistema, migrações e auditoria.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseOptions
);

/**
 * Cliente anon do Supabase (respeita RLS)
 * Use este para operações em nome do usuário logado.
 */
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseOptions
);
