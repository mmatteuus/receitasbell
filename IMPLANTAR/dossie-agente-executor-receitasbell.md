# Dossiê Executivo — Correção do Admin, Main Only e Deploy

**Projeto:** Receitas Bell  
**Trilha:** C — Auditar e melhorar  
**Estado final obrigatório:** tudo em `main`, branch secundária removida, admin funcional, produção implantada  
**Assinatura:** Desenvolvido por MtsFerreira — mtsferreira.dev

---

## STATUS ATUAL (executado por OpenCode)

### Atualizacao v2 (2026-04-01)

- Fonte: IMPLANTAR/auditoria-receitasbell-v2.md
- Vercel ja esta em Node 20.x, mas o ultimo deploy de producao esta CANCELED
- Dominios ativos na Vercel nao incluem receitasbell.vercel.app
- admin@receitasbell.com existe em auth.users e public.profiles (role owner, password_hash presente)
- Ha 3 tenants ativos (default e preview ainda ativos)

### Concluido

- createUser(...) agora persiste id, password_hash, legacy_password e full_name
- createTenantBootstrap cria auth user via supabaseAdmin, usa adminPasswordPlain e define host
- bootstrap admin passa adminPasswordPlain
- signup-password cria profile explicitamente com tenantSlug
- scripts/fix-admin-receitasbell.mjs criado
- npm install, lint, typecheck, build, test:unit executados (lint com 1 warning em vite.config.ts: prefer-const)
- branch remota fix/admin-recovery-script removida (sem commits exclusivos)
- criar/atualizar admin em producao via scripts/fix-admin-receitasbell.mjs (executado com sucesso)
- alinhar Node da Vercel para 20.x (executado via navegador)

### Pendente

- validar login admin por curl e executar smoke test final (parcialmente validado)
- commit + push na main
- deploy de producao e validar status READY
- alinhar host do tenant principal com dominio ativo na Vercel
- confirmar CI workflow ativo (fora do caminho padrao, se existir)
- avaliar tenants default/preview e desativar se nao forem necessarios

---

## 1. Objetivo

Corrigir o incidente de autenticação do painel admin, eliminar a causa raiz no código, restaurar o usuário administrador no banco, consolidar todo o trabalho no ramo `main`, apagar o ramo secundário e executar deploy em produção sem quebra de compatibilidade.

---

## 2. Escopo exato

O agente executor deve:

1. Corrigir o fluxo de bootstrap do tenant/admin.
2. Corrigir a persistência de credenciais do admin em `profiles`.
3. Corrigir o fluxo de signup para não depender de trigger implícita no Supabase.
4. Criar ou atualizar o admin de produção `admin@receitasbell.com`.
5. Garantir que apenas o ramo `main` exista ao final.
6. Alinhar a configuração da Vercel com a versão de Node do projeto.
7. Fazer deploy em produção.
8. Validar por smoke test.

---

## 3. FATO / SUPOSIÇÃO / PENDENTE

### FATO

- O projeto usa Node `20.x` no repositório.
- A Vercel do projeto esta configurada com Node `20.x`.
- O ultimo deploy de producao na Vercel esta CANCELED.
- Os dominios ativos na Vercel nao incluem `receitasbell.vercel.app`.
- O login admin é feito por `POST /api/admin/auth/session`.
- O login busca usuário em `public.profiles` por `email + organization_id`.
- O login exige `role` igual a `admin` ou `owner`.
- O bootstrap atual cria auth user via supabaseAdmin e profile correspondente (corrigido).
- O `createUser(...)` persiste corretamente `id`, `password_hash` e `legacy_password` (corrigido).
- O usuario `admin@receitasbell.com` existe em `auth.users` e `public.profiles`.
- Ha apenas o ramo `main` no remoto.
- Ha 3 tenants ativos no banco (default e preview incluidos).

### SUPOSIÇÃO

- O executor terá acesso operacional ao GitHub, Vercel e Supabase.

### [PENDENTE]

- Confirmar se existe workflow CI ativo fora do caminho padrao.
- Confirmar se o deploy de producao da Vercel aponta para o ultimo commit da `main` no momento da execucao.
- Confirmar qual dominio final deve ser usado pelo tenant principal.

---

## 4. Snapshot técnico do backend

### Stack

- Vite
- TypeScript
- React
- Supabase
- Vercel Functions
- Vitest
- Playwright

### Arquivos-chave

- `src/server/admin/auth.ts`
- `src/server/identity/repo.ts`
- `src/server/tenancy/service.ts`
- `src/server/tenancy/repo.ts`
- `src/server/tenancy/resolver.ts`
- `src/server/auth/sessions.ts`
- `api_handlers/admin/auth/session.ts`
- `api_handlers/auth/signup-password.ts`
- `src/server/integrations/supabase/client.ts`
- `src/server/shared/env.ts`
- `.env.example`
- `package.json`

### Fluxos críticos

1. Login do painel admin
2. Bootstrap do primeiro tenant com owner admin
3. Signup com senha

---

## 5. Causa raiz do erro do admin

O erro do painel admin ocorre porque o backend procura o administrador em `public.profiles`, dentro do tenant resolvido, e exige role administrativa.

O problema real é duplo:

1. **Dado quebrado em produção:** não existia profile/admin válido para `admin@receitasbell.com`.
2. **Código quebrado na origem:** o bootstrap do tenant não cria corretamente o usuário no Supabase Auth e o repositório de identidade não persiste corretamente o vínculo e a credencial do admin.

Resultado: mesmo que o tenant exista, o admin não consegue autenticar.

---

## 6. Resultado final esperado

Ao fim da execução, tudo abaixo deve ser verdadeiro:

- `admin@receitasbell.com` existe em `auth.users`
- existe registro correspondente em `public.profiles`
- `profiles.id == auth.users.id`
- `role` do admin é `owner` ou `admin`
- `password_hash` do admin existe
- `POST /api/admin/auth/session` retorna `200`
- o deploy de produção está `READY`
- só existe o ramo `main`
- o ramo `fix/admin-recovery-script` foi removido

---

## 7. Plano sequencial obrigatório

### Fase 0 — Baseline e segurança operacional

#### Objetivo

Congelar estado antes das mudanças.

#### Comandos

```bash
git checkout main
git fetch origin --prune
git pull origin main
git tag backup/pre-admin-fix-$(date +%Y%m%d-%H%M%S)
npm install
npm run lint
npm run typecheck
npm run build
npm run test:unit
```

#### Critério de aceite

- baseline validado
- tag de recuperação criada
- build local passa

#### Rollback

```bash
git reset --hard <tag_criada>
```

---

### Fase 1 — Corrigir persistência de profile/admin

#### Objetivo

Fazer `createUser(...)` persistir o vínculo correto com Auth e a credencial administrativa.

#### Arquivo-alvo

- `src/server/identity/repo.ts`

#### Substituir a implementação de `createUser(...)` por

```ts
export async function createUser(input: {
  userId: string;
  tenantId: string;
  email: string;
  displayName?: string;
  role?: string;
  status?: 'active' | 'inactive';
  passwordHash?: string;
  legacyPassword?: string;
}): Promise<UserRecord> {
  const username = input.email.split('@')[0];

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: input.userId,
      email: input.email.toLowerCase(),
      organization_id: input.tenantId,
      display_name: input.displayName || username,
      full_name: input.displayName || username,
      username,
      role: input.role || 'member',
      is_active: input.status !== 'inactive',
      password_hash: input.passwordHash || null,
      legacy_password: input.legacyPassword || null,
    })
    .select()
    .single();

  if (error || !data) throw error;
  return mapProfileToRecord(data);
}
```

#### Critério de aceite

- `profiles.id` passa a ser controlado pelo chamador
- `password_hash` é persistido
- `legacy_password` é persistido quando existir

#### Validação

```bash
npm run lint && npm run typecheck && npm run test:unit
```

#### Risco

Baixo.

#### Rollback

```bash
git checkout -- src/server/identity/repo.ts
```

#### Protocolo de não-quebra

- mudança aditiva/compatível
- sem remoção de contrato
- rollback em um comando

---

### Fase 2 — Corrigir bootstrap do tenant/admin

#### Objetivo

Garantir que o bootstrap crie o usuário real no Supabase Auth e o profile correspondente.

#### Arquivo-alvo

- `src/server/tenancy/service.ts`

#### Ajustar assinatura da função

```ts
export async function createTenantBootstrap(input: {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminDisplayName?: string;
  adminPasswordHash: string;
  adminPasswordPlain: string;
});
```

#### Implementação proposta

```ts
import { supabaseAdmin } from '../integrations/supabase/client.js';
import { createUser } from '../identity/repo.js';
import { ApiError } from '../shared/http.js';

export async function createTenantBootstrap(input: {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminDisplayName?: string;
  adminPasswordHash: string;
  adminPasswordPlain: string;
}) {
  const tenantName = input.tenantName.trim();
  const tenantSlug = normalizeTenantSlug(input.tenantSlug);
  const adminEmail = input.adminEmail.trim().toLowerCase();

  if (!tenantName) throw new ApiError(400, 'Tenant name required');
  if (!tenantSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenantSlug)) {
    throw new ApiError(400, 'Tenant slug must use lowercase letters, numbers, and hyphens');
  }
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new ApiError(400, 'Valid admin email required');
  }
  if (!input.adminPasswordPlain) {
    throw new ApiError(400, 'Admin password required');
  }

  const existingTenant = await getTenantBySlug(tenantSlug);
  if (existingTenant) {
    throw new ApiError(409, 'Tenant slug already exists');
  }

  const tenant = await createTenant({
    slug: tenantSlug,
    name: tenantName,
    host: `${tenantSlug}.vercel.app`,
  });

  const authResult = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: input.adminPasswordPlain,
    email_confirm: true,
    user_metadata: {
      full_name: input.adminDisplayName || adminEmail.split('@')[0],
    },
  });

  if (authResult.error || !authResult.data.user) {
    throw new ApiError(400, authResult.error?.message || 'Failed to create auth user');
  }

  const adminUser = await createUser({
    userId: authResult.data.user.id,
    tenantId: tenant.id,
    email: adminEmail,
    displayName: input.adminDisplayName || adminEmail.split('@')[0],
    role: 'owner',
    status: 'active',
    passwordHash: input.adminPasswordHash,
  });

  return { tenant, adminUser };
}
```

#### Critério de aceite

- bootstrap cria tenant
- bootstrap cria usuário em `auth.users`
- bootstrap cria `profiles` com o mesmo `id`
- owner consegue logar depois

#### Validação

```bash
npm run lint && npm run typecheck && npm run build && npm run test:unit
```

#### Risco

Médio.

#### Rollback

```bash
git checkout -- src/server/tenancy/service.ts
```

#### Protocolo de não-quebra

- mantém contrato funcional
- só adiciona persistência correta
- sem remoção de compatibilidade

---

### Fase 3 — Corrigir chamada do bootstrap no auth admin

#### Objetivo

Passar a senha em claro para criação do usuário no Supabase Auth.

#### Arquivo-alvo

- `src/server/admin/auth.ts`

#### Localizar este trecho e substituir

```ts
const { tenant, adminUser } = await createTenantBootstrap({
  tenantName: input.tenantName || '',
  tenantSlug: input.tenantSlug || '',
  adminEmail: input.adminEmail || '',
  adminDisplayName: input.adminEmail?.split('@')[0] || '',
  adminPasswordHash,
  adminPasswordPlain: adminPassword,
});
```

#### Critério de aceite

- `createTenantBootstrap` recebe `adminPasswordPlain`
- compilação sem erro

#### Validação

```bash
npm run lint && npm run typecheck && npm run test:unit
```

#### Risco

Baixo.

#### Rollback

```bash
git checkout -- src/server/admin/auth.ts
```

---

### Fase 4 — Corrigir signup sem depender de trigger implícita

#### Objetivo

Garantir que o signup crie o profile explicitamente.

#### Arquivo-alvo

- `api_handlers/auth/signup-password.ts`

#### Substituir por

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  withApiHandler,
  json,
  assertMethod,
  ApiError,
  readJsonBody,
} from '../../src/server/shared/http.js';
import { supabaseAdmin } from '../../src/server/integrations/supabase/client.js';
import { createSession } from '../../src/server/auth/sessions.js';

export default withApiHandler(async (req, res, { requestId, logger }) => {
  assertMethod(req, ['POST']);
  const body = await readJsonBody<{
    email?: string;
    password?: string;
    fullName?: string;
    tenantSlug?: string;
  }>(req);
  const { email, password, fullName, tenantSlug } = body || {};

  if (!email || !password || !fullName || !tenantSlug) {
    throw new ApiError(400, 'email, password, fullName e tenantSlug são obrigatórios.');
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('organizations')
    .select('id, slug')
    .eq('slug', tenantSlug)
    .single();

  if (tenantError || !tenant) {
    throw new ApiError(404, 'Tenant não encontrado.');
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true,
  });

  if (authError || !authData.user) {
    logger.error('Falha no signup do Supabase', authError);
    throw new ApiError(400, authError?.message || 'Erro ao criar conta.');
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
    {
      id: authData.user.id,
      organization_id: tenant.id,
      email: authData.user.email!.toLowerCase(),
      username: authData.user.email!.split('@')[0],
      display_name: fullName,
      full_name: fullName,
      role: 'member',
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new ApiError(500, 'Erro ao configurar perfil de usuário.');
  }

  await createSession(req, res, {
    tenantId: tenant.id,
    userId: authData.user.id,
    email: authData.user.email!,
    role: 'user',
  });

  return json(res, 201, {
    success: true,
    data: {
      ok: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    },
    requestId,
  });
});
```

#### Critério de aceite

- signup deixa de depender de trigger
- profile é criado por código
- sessão é criada corretamente

#### Validação

```bash
npm run lint && npm run typecheck && npm run test:unit
```

#### Risco

Médio.

#### Rollback

```bash
git checkout -- api_handlers/auth/signup-password.ts
```

#### Protocolo de não-quebra

- preserva objetivo da rota
- apenas remove dependência implícita do banco

---

### Fase 5 — Criar script de recuperação do admin de produção

#### Objetivo

Restaurar imediatamente o admin operacional.

#### Arquivo-alvo

- `scripts/fix-admin-receitasbell.mjs`

#### Conteúdo completo

```js
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
  throw new Error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
}
if (!ADMIN_PASSWORD) {
  throw new Error('Defina ADMIN_PASSWORD.');
}
if (!['admin', 'owner'].includes(ADMIN_ROLE)) {
  throw new Error('ADMIN_ROLE deve ser admin ou owner.');
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

    const existing = data.users.find((u) => (u.email || '').toLowerCase() === email);
    if (existing) {
      const updated = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_NAME },
      });
      if (updated.error || !updated.data.user) {
        throw updated.error || new Error('Falha ao atualizar auth user.');
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
    throw created.error || new Error('Falha ao criar auth user.');
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
    throw tenantError || new Error('Tenant não encontrado.');
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
```

#### Executar

```bash
SUPABASE_URL="https://SEU-PROJETO.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY" \
ADMIN_EMAIL="admin@receitasbell.com" \
ADMIN_PASSWORD="TroqueAgora!123#" \
TENANT_SLUG="receitasbell" \
node scripts/fix-admin-receitasbell.mjs
```

#### Critério de aceite

- script imprime `ok: true`
- usuário existe em `auth.users`
- profile existe em `public.profiles`
- `role` é `owner` ou `admin`

#### Rollback

- trocar a senha do admin
- ou desativar o profile/admin no Supabase

---

### Fase 6 — Validar login admin

#### Objetivo

Confirmar a restauração funcional do painel.

#### Comando

```bash
curl -i \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: receitasbell" \
  -H "X-CSRF-Token: teste" \
  --cookie "__Host-rb_csrf=teste" \
  -d '{"email":"admin@receitasbell.com","password":"TroqueAgora!123#"}' \
  https://receitasbell.vercel.app/api/admin/auth/session
```

#### Resultado esperado

- HTTP `200`
- payload com `authenticated: true`

#### Validação adicional

```bash
curl -i https://receitasbell.vercel.app/api/admin/auth/session
```

Sem cookie de sessão, `401` é aceitável.  
Com cookie após login, deve retornar sessão autenticada.

---

### Fase 7 — Consolidar tudo em `main` e apagar branch secundária

#### Objetivo

Cumprir a regra de um único ramo.

#### Passos

1. Verificar se há commits exclusivos no ramo secundário.
2. Se não houver, apagar.
3. Se houver, trazer para `main` e apagar em seguida.

#### Comandos de verificação

```bash
git fetch origin --prune
git branch -a
git log --oneline origin/main..origin/fix/admin-recovery-script
```

#### Se não houver saída no último comando

```bash
git push origin --delete fix/admin-recovery-script
git fetch origin --prune
```

#### Se houver commits exclusivos

```bash
git checkout main
git merge --ff-only origin/fix/admin-recovery-script || git merge --no-ff origin/fix/admin-recovery-script
git push origin main
git push origin --delete fix/admin-recovery-script
git fetch origin --prune
```

#### Critério de aceite

- apenas `main` existe remotamente

#### Rollback

```bash
git checkout -b fix/admin-recovery-script <sha_antigo>
git push origin fix/admin-recovery-script
```

---

### Fase 8 — Alinhar Vercel e fazer deploy

#### Objetivo

Eliminar drift de runtime e publicar a correção.

#### Ação obrigatória na Vercel

Ajustar a versão de Node do projeto para `20.x`.

#### Commit final

```bash
git add .
git commit -m "fix: restore admin auth bootstrap and enforce main-only flow"
git push origin main
```

#### Deploy

Executar deploy de produção pela integração Git ou pelo painel da Vercel.

#### Critério de aceite

- deployment em produção com status `READY`
- login admin funcionando
- painel admin acessível

#### Rollback

```bash
git revert HEAD
git push origin main
```

---

## 8. Checklist de aceite final (pendente)

- [ ] admin criado/recuperado no Supabase (auth.users + profiles com role admin/owner)
- [ ] login admin retorna `200`
- [ ] Vercel alinhada para Node `20.x`
- [ ] commit + push na `main`
- [ ] deploy de producao realizado e status `READY`
- [ ] smoke test final aprovado

---

## 9. Smoke test final

```bash
curl -i \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: receitasbell" \
  -H "X-CSRF-Token: teste" \
  --cookie "__Host-rb_csrf=teste" \
  -d '{"email":"admin@receitasbell.com","password":"TroqueAgora!123#"}' \
  https://receitasbell.vercel.app/api/admin/auth/session
```

Esperado:

- HTTP `200`
- `authenticated: true`

---

## 10. Protocolo de não-quebra aplicado

### Classificação das mudanças

| Mudança                            | Tipo                 | Risco | Feature flag | Rollback                        |
| ---------------------------------- | -------------------- | ----- | ------------ | ------------------------------- |
| Persistência correta em `profiles` | aditiva/corretiva    | baixo | não          | `git checkout -- arquivo`       |
| Bootstrap com criação de auth user | alteração controlada | médio | não          | `git checkout -- arquivo`       |
| Signup sem trigger implícita       | alteração controlada | médio | opcional     | `git checkout -- arquivo`       |
| Recovery do admin                  | correção operacional | médio | não          | resetar senha/desativar usuário |
| Exclusão da branch secundária      | operação Git         | baixo | não          | recriar branch por SHA          |
| Deploy em produção                 | rollout              | médio | não          | `git revert HEAD`               |

### Regras verificadas

- mudança aditiva primeiro
- rollback em um comando
- validação antes e depois
- deploy só após smoke
- sem quebra intencional de contrato HTTP existente

---

## 11. Riscos futuros

### 3 meses

- reaparecimento do incidente se o código for parcialmente aplicado
- drift de runtime entre repo e Vercel
- senha provisória do admin não ser rotacionada

### 1 ano

- crescimento de `auth_sessions` sem limpeza operacional
- dívida técnica por mistura de auth app + auth Supabase + legado
- regressões se continuar sem pipeline CI forte

### 3 anos

- necessidade de refatorar identidade/tenancy/session em módulos mais explícitos
- exigências maiores de auditoria/compliance
- custo de manutenção crescer se bootstrap/signup seguirem acoplados demais ao banco

---

## 12. Handoff imperativo final (pendente)

1. (Opcional) gere tag de backup se fizer sentido apos as mudancas.
2. Execute `scripts/fix-admin-receitasbell.mjs` em producao com SUPABASE\_\* e senha do admin.
3. Valide o login admin por `curl`.
4. Ajuste a Vercel para Node `20.x`.
5. `git add .` + `git commit -m "fix: restore admin auth bootstrap and enforce main-only flow"` + `git push origin main`.
6. Faça deploy de producao.
7. Rode smoke test final.
8. Se falhar, faça rollback por `git revert HEAD` e redeploy.

---

## 13. Comando-resumo final

```bash
git checkout main && \
git fetch origin --prune && \
git pull origin main && \
npm install && \
npm run lint && \
npm run typecheck && \
npm run build && \
npm run test:unit
```

Depois:

```bash
git add . && \
git commit -m "fix: restore admin auth bootstrap and enforce main-only flow" && \
git push origin main
```

---

## 14. Encerramento

Este dossiê foi escrito para execução direta, sem decisão arquitetural adicional pelo executor.

**Estado final obrigatório:**

- admin funcional
- bootstrap corrigido
- signup corrigido
- produção implantada
- somente `main`
- branch secundária removida

**Desenvolvido por MtsFerreira — mtsferreira.dev**
