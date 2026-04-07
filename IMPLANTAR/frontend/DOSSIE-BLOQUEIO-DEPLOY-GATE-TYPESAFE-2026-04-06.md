# Dossiê - Bloqueio de Deploy, Gate e Patch Typesafe Mínimo

Status: PRONTO PARA EXECUÇÃO
Data: 2026-04-06
Escopo: destravar deploy da `main` sem quebrar a aplicação
Frente: frontend web com bloqueio atual no gate de server lint

---

## 1. Objetivo

Este dossiê existe para destravar o deploy da `main` com a menor alteração possível e com o menor risco possível.

A regra aqui é simples:

- corrigir somente o que está impedindo o deploy
- não inventar refatoração grande
- não alterar contrato funcional
- não mexer em PWA
- não mexer em fluxo crítico já validado na `main`
- depois do deploy destravado, validar visualmente o que já está pronto no frontend

Se houver conflito entre melhorar mais e reduzir risco, vence reduzir risco.

---

## 2. Diagnóstico resumido

### FATO
O último deploy de produção falhou no `npm run gate` por causa de lint com `@typescript-eslint/no-explicit-any`.

### FATO
Os arquivos que bloquearam o deploy foram:

- `src/server/integrations/supabase/client.ts`
- `src/server/shared/cache.ts`

### FATO
Enquanto esse bloqueio existir, correções já presentes na `main` podem não aparecer no site porque o deploy não conclui.

### FATO
Na `main` atual, a tela de conta já contém:

- botão de voltar ao site
- botão de sair
- uso de `logoutUser()`

Ou seja: se isso ainda não aparece para o usuário final, o problema mais provável é deploy travado, não ausência de código.

---

## 3. Estratégia mínima de correção

### Meta
Remover o uso de `any` com mudança pequena, localizada e sem alterar comportamento.

### O que NÃO fazer

- não trocar SDK
- não reescrever cache
- não mudar estratégia de autenticação do Supabase
- não mudar timeout
- não mudar endpoints
- não introduzir generics complexos sem necessidade
- não mexer em regras de negócio

### O que fazer

- tipar corretamente o `fetch` custom do Supabase
- trocar `any` por `unknown` no cache local
- tipar a resposta do Redis REST
- manter o comportamento atual intacto

---

## 4. Patch exato - arquivo 1

## Arquivo
`src/server/integrations/supabase/client.ts`

## Problema atual
Há `any` em:

- `const supabaseOptions: any`
- `fetch: (input: any, init: any)`

## Objetivo
Manter o timeout custom sem `any`.

## Substituição exata

### Código final esperado
```ts
import { createClient } from "@supabase/supabase-js";
import { env } from "../../shared/env.js";

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Certifique-se de configurar as variáveis de ambiente.");
}

/**
 * Configuração global com timeout para o Supabase
 */
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: fetchWithTimeout,
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
```

## Por que isso é seguro

- mantém o mesmo timeout de 10 segundos
- mantém o mesmo `AbortController`
- mantém o mesmo comportamento de admin e anon client
- só remove `any`
- o tipo `typeof fetch` é nativo, estável e compatível com a função já existente

## Risco
Baixo.

## Critério de aceite

- nenhum `any` restante neste arquivo
- o cliente Supabase continua compilando
- o timeout continua funcionando

---

## 5. Patch exato - arquivo 2

## Arquivo
`src/server/shared/cache.ts`

## Problema atual
Há `any` em:

- `value: any` no `localCache`
- parâmetro `value: any` em `setLocal`
- tipagem implícita fraca no `res.json()` do Redis REST

## Objetivo
Tipar cache sem alterar comportamento.

## Substituição exata

### Código final esperado
```ts
import { env } from "./env.js";

type CacheOptions = {
  ttlSeconds?: number;
};

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

type RedisGetResponse = {
  result?: string | null;
};

const localCache = new Map<string, CacheEntry>();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const local = localCache.get(key);
    if (local && local.expiresAt > Date.now()) {
      return local.value as T;
    }

    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/get/${key}`, {
          headers: {
            Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        });

        const data = (await res.json()) as RedisGetResponse;

        if (data.result) {
          const value = JSON.parse(data.result) as T;
          this.setLocal(key, value, 60);
          return value;
        }
      } catch (err) {
        console.warn("[Cache] Redis get error:", err);
      }
    }

    return null;
  },

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttlSeconds || 300;
    const expiresAt = Date.now() + ttl * 1000;

    localCache.set(key, { value, expiresAt });

    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        await fetch(`${env.UPSTASH_REDIS_REST_URL}/set/${key}/${ttl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          },
          body: JSON.stringify(value),
        });
      } catch (err) {
        console.warn("[Cache] Redis set error:", err);
      }
    }
  },

  setLocal(key: string, value: unknown, ttlSeconds: number) {
    localCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async delete(key: string): Promise<void> {
    localCache.delete(key);
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        await fetch(`${env.UPSTASH_REDIS_REST_URL}/del/${key}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
      } catch (err) {
        console.warn("[Cache] Redis del error:", err);
      }
    }
  },
};
```

## Por que isso é seguro

- mantém o cache em memória do jeito atual
- mantém a integração com Upstash do jeito atual
- mantém o parsing JSON do jeito atual
- apenas troca `any` por tipos defensivos e explícitos

## Risco
Baixo.

## Critério de aceite

- nenhum `any` restante neste arquivo
- `cache.get`, `cache.set`, `cache.delete` continuam funcionando
- o gate de lint deixa de falhar por este arquivo

---

## 6. Ordem obrigatória de execução

1. `git pull origin main`
2. aplicar patch do arquivo `client.ts`
3. aplicar patch do arquivo `cache.ts`
4. rodar `npm run lint`
5. rodar `npm run gate`
6. fazer commit
7. `git push origin main`
8. validar novo deploy da Vercel
9. só depois disso continuar nas correções do frontend visual

---

## 7. Smoke test pós-correção

### Obrigatório
```bash
npm run lint
npm run gate
```

### Depois do deploy
- confirmar que a Vercel sai de `ERROR`
- abrir o domínio publicado
- validar se a conta já mostra:
  - voltar ao site
  - sair
- confirmar que a `main` publicada está refletindo o estado atual do código

---

## 8. O que fazer depois que o deploy destravar

Somente depois do deploy verde, executar o patch de frontend visual que já está documentado em:

`IMPLANTAR/frontend/PATCH-EXATO-CATEGORIAS-DIALOG-IMAGENS-2026-04-06.md`

Esse segundo patch cobre:

- categorias com emoji
- remoção do `X` duplicado no mobile
- regra defensiva para imagem de receita não reincidir

---

## 9. Rollback

Se algo der errado:

- reverter apenas os 2 arquivos acima
- não tocar em outros arquivos do sistema
- registrar no log que o bloqueio continua no gate

Como a alteração é mínima e localizada, rollback é simples e de baixo risco.

---

## 10. Resultado esperado

Ao final deste dossiê, o projeto deve ficar assim:

- `main` volta a passar no lint
- deploy da Vercel deixa de falhar por `no-explicit-any`
- correções de frontend já presentes na `main` podem aparecer no site
- a fila do frontend visual volta a andar com segurança

---

## 11. Regra final

Se houver tentação de refatorar mais do que isso neste momento, não refatore.

Primeiro:
- destravar deploy

Depois:
- continuar o frontend visual

Essa é a ordem segura.
