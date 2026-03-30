# Dossiê Específico — OAuth Social do Usuário Final e Revisão do Magic Link

---

## 1. Objetivo

Concluir a autenticação do usuário final com **Google primeiro**, mantendo:
- sessão server-side atual
- `/api/auth/me` como fonte de verdade
- magic link como fallback
- login admin completamente isolado

---

## 2. Diagnóstico do fluxo atual

## FATO
A página `/minha-conta` ainda faz:
- input de e-mail local
- atualização de identidade local
- mensagem explícita de que a conexão final com provedor ainda não foi concluída

### Conclusão
O fluxo atual é um **MVP transitório**, não um social auth finalizado.

---

## 3. Decisão de arquitetura

## Trilha funcional
- **Google** como primeiro provider
- **arquitetura multi-provider** desde o início
- **sessions.ts** reaproveitado
- **magic link** mantido
- **sem tocar** no login admin

## Camadas novas
```text
src/server/auth/social/
  providers.ts
  state.ts
  repo.ts
  service.ts
  start.ts
  callback.ts
  types.ts

api_handlers/auth/
  oauth-start.ts
  oauth-callback.ts
```

---

## 4. Regras duras

1. Não salvar access token do provider no cliente.
2. Não confiar em identidade local do frontend para autenticação final.
3. Resolver tenant sempre no backend.
4. Criar sessão final via `createSession()`.
5. Bloquear social auth se `BASEROW_TABLE_SESSIONS` não estiver disponível em produção.
6. Bloquear social auth se rate limit distribuído não estiver disponível em produção.
7. Exigir `email_verified = true`.
8. Não tocar em `api/admin/auth/session`.
9. Manter fallback por magic link.
10. Todo rollout social deve ficar atrás de feature flag.

---

## 5. Contratos HTTP propostos

## `POST /api/auth/oauth/start`
**Request**
```json
{
  "provider": "google",
  "redirectTo": "/minha-conta"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://accounts.google.com/..."
  }
}
```

## `GET /api/auth/oauth/callback?provider=google&code=...&state=...`
**Comportamento**
- valida state
- consome state one-time
- troca code por token
- chama userinfo
- resolve ou cria vínculo
- cria sessão
- redireciona para `redirectTo`

## `GET /api/auth/me`
Mantido.  
Opcionalmente enriquecido com:
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "123",
      "email": "a@b.com",
      "tenantId": "34",
      "tenantSlug": "receitasbell",
      "role": "user",
      "provider": "google"
    }
  }
}
```

---

## 6. Tabelas novas necessárias

## `auth_oauth_states`
Campos:
- `tenant_id`
- `provider`
- `state_hash`
- `redirect_to`
- `expires_at`
- `consumed_at`
- `ip`
- `user_agent`
- `created_at`
- `status`

## `user_identities_social`
Campos:
- `tenant_id`
- `user_id`
- `provider`
- `provider_subject`
- `email`
- `email_verified`
- `picture_url`
- `linked_at`
- `last_login_at`
- `created_at`
- `updated_at`
- `status`

### Regra
Unique lógico:
- `tenant_id + provider + provider_subject`

---

## 7. Variáveis de ambiente novas

Adicionar em `.env.example` e `src/server/shared/env.ts`:
```env
AUTH_SOCIAL_ENABLED=false
AUTH_SOCIAL_ALLOWED_TENANTS=
GOOGLE_OAUTH_CLIENT_ID=UNSPECIFIED
GOOGLE_OAUTH_CLIENT_SECRET=UNSPECIFIED
GOOGLE_OAUTH_REDIRECT_URI=UNSPECIFIED
BASEROW_TABLE_AUTH_OAUTH_STATES=UNSPECIFIED
BASEROW_TABLE_USER_IDENTITIES=UNSPECIFIED
```

### Regras
- `AUTH_SOCIAL_ENABLED` controla o rollout global
- `AUTH_SOCIAL_ALLOWED_TENANTS` limita rollout por tenant
- produção não deve prosseguir sem envs do Google válidas

---

## 8. Implementação detalhada

### TASK-AUTH-001 — Provider registry
**Arquivo:** `src/server/auth/social/providers.ts`

```ts
export type SocialProvider = "google";

export const SOCIAL_PROVIDERS = {
  google: {
    provider: "google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scopes: ["openid", "email", "profile"],
  },
} as const;
```

---

### TASK-AUTH-002 — Persistência de state
**Arquivo:** `src/server/auth/social/state.ts`

**Responsabilidades**
- gerar state opaco
- hashear state
- persistir hash
- validar expiração
- consumir uma vez
- rejeitar replay

**Snippet**
```ts
import crypto from "node:crypto";

export function createOpaqueState() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashOpaqueState(state: string) {
  return crypto.createHash("sha256").update(state).digest("hex");
}
```

---

### TASK-AUTH-003 — Repositório de identidade social
**Arquivo:** `src/server/auth/social/repo.ts`

**Responsabilidades**
- localizar vínculo por `tenant + provider + subject`
- criar vínculo novo
- atualizar `last_login_at`
- localizar/criar `user` do tenant

**Regra**
Nunca confiar só em e-mail para identidade primária do provider; o vínculo canônico é `provider_subject`.

---

### TASK-AUTH-004 — Start handler
**Arquivos**
- `src/server/auth/social/start.ts`
- `api_handlers/auth/oauth-start.ts`

**Passos**
1. validar feature flag
2. resolver tenant
3. aplicar rate limit distribuído
4. gerar state
5. persistir hash
6. montar URL do Google
7. retornar `authorizationUrl`

**Snippet**
```ts
export async function startSocialOAuth(input: {
  provider: "google";
  tenantId: string;
  redirectTo: string;
  userAgent?: string;
  ip?: string;
}) {
  const state = createOpaqueState();
  const stateHash = hashOpaqueState(state);

  await saveAuthOAuthState({
    tenant_id: input.tenantId,
    provider: input.provider,
    state_hash: stateHash,
    redirect_to: input.redirectTo,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    user_agent: input.userAgent || "",
    ip: input.ip || "",
  });

  const url = new URL(SOCIAL_PROVIDERS.google.authUrl);
  url.searchParams.set("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID!);
  url.searchParams.set("redirect_uri", process.env.GOOGLE_OAUTH_REDIRECT_URI!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SOCIAL_PROVIDERS.google.scopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return { authorizationUrl: url.toString() };
}
```

---

### TASK-AUTH-005 — Callback handler
**Arquivos**
- `src/server/auth/social/callback.ts`
- `api_handlers/auth/oauth-callback.ts`

**Passos**
1. rate limit distribuído
2. validar/consumir state
3. trocar code por token
4. buscar profile
5. exigir `email_verified`
6. resolver vínculo
7. resolver/criar user do tenant
8. criar sessão com `createSession()`
9. redirect final

**Snippet**
```ts
export async function finishGoogleOAuth(params: {
  code: string;
  state: string;
  tenantId: string;
}) {
  const stateRow = await consumeValidAuthOAuthState(params.state, "google", params.tenantId);

  const token = await exchangeGoogleCode(params.code);
  const profile = await fetchGoogleProfile(token.access_token);

  if (!profile.email || !profile.email_verified) {
    throw new ApiError(403, "Verified email is required");
  }

  const user = await resolveOrCreateTenantUserFromProvider({
    tenantId: params.tenantId,
    provider: "google",
    providerSubject: profile.sub,
    email: profile.email,
    pictureUrl: profile.picture ?? null,
  });

  return {
    user,
    redirectTo: stateRow.redirect_to || "/minha-conta",
  };
}
```

---

## 9. Frontend `/minha-conta`

### TASK-AUTH-006 — integrar botão social
**Arquivos**
- `src/pages/AccountHome.tsx`
- `src/lib/api/socialAuth.ts` (criar)

**Regras**
- exibir botão Google sob flag
- manter botão e-mail
- após callback, revalidar `/api/auth/me`
- não guardar token do provider

**Snippet**
```ts
export async function startSocialAuth(provider: "google", redirectTo?: string) {
  const res = await fetch("/api/auth/oauth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, redirectTo }),
  });

  const payload = await res.json();
  window.location.href = payload.data.authorizationUrl;
}
```

```tsx
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={() => startSocialAuth("google", params.get("redirect") || "/minha-conta")}
>
  Continuar com Google
</Button>
<Button type="submit" className="w-full" disabled={authorizing}>
  {authorizing ? "Entrando..." : "Continuar com e-mail"}
</Button>
```

---

## 10. Revisão do magic link

## Problema suspeito
O código fala em 15 minutos, mas o storage real precisa confirmar se `expiresAt` suporta datetime completo.

### TASK-ML-001 — inspecionar schema real
**Objetivo:** verificar se `magic_links.expiresAt` é date-only ou datetime.

### Se for date-only
Aplicar **expand-contract**:
1. adicionar `expiresAtIso`
2. escrever nos dois campos
3. consumir priorizando `expiresAtIso`
4. migrar histórico
5. só depois descontinuar `expiresAt`

### Critério de aceite
- token expira na janela correta em minutos
- não expira “no fim do dia” por acidente

### Snippet de leitura segura
```ts
function resolveMagicLinkExpiry(row: { expiresAt?: string | null; expiresAtIso?: string | null }) {
  if (row.expiresAtIso) {
    const iso = new Date(row.expiresAtIso);
    if (!Number.isNaN(iso.getTime())) return iso.getTime();
  }

  if (row.expiresAt) {
    const legacy = new Date(`${row.expiresAt}T23:59:59Z`);
    if (!Number.isNaN(legacy.getTime())) return legacy.getTime();
  }

  return 0;
}
```

---

## 11. Rate limit e sessão — endurecimento obrigatório

### TASK-AUTH-007 — bloquear fallback memory em prod
**Arquivo:** `src/server/shared/rateLimit.ts` + wrapper específico de auth

**Regra**
Para start/callback social:
- se backend != Upstash em produção → 503

**Snippet**
```ts
export async function requireDistributedAuthRateLimit(key: string) {
  const result = await AuthRateLimit.check(key);
  if (process.env.NODE_ENV === "production" && result.backend !== "upstash") {
    throw new ApiError(503, "Auth rate limit backend unavailable");
  }
  if (!result.success) {
    throw new ApiError(429, "Too many attempts", {
      retryAfter: result.resetAfter,
    });
  }
}
```

### TASK-AUTH-008 — bloquear fallback stateless em prod
**Regra**
Se social auth estiver ativo em produção e a tabela Sessions não estiver configurada/acessível:
- falhar com 503
- não cair em cookie stateless

---

## 12. Testes obrigatórios

### Unit
- state expirado
- replay de state
- email não verificado
- vínculo existente
- create user on first login
- fallback e-mail continua

### Integration
- `/api/auth/oauth/start`
- `/api/auth/oauth/callback`
- `/api/auth/me` após callback
- logout

### E2E
- `/minha-conta` com botão social ativo
- retorno do callback
- tenant resolution
- fallback por e-mail preservado

**Comandos**
```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
npm run test:smoke
```

---

## 13. Rollout

### Faseada
1. `AUTH_SOCIAL_ENABLED=true`
2. `AUTH_SOCIAL_ALLOWED_TENANTS=tenant-interno`
3. validar
4. expandir p/ 5 tenants
5. expandir por blocos
6. abrir geral

### Rollback
```bash
# rollback imediato por configuração
AUTH_SOCIAL_ENABLED=false

# se necessário
git revert HEAD
```

### Critério de não-quebra
- login admin intacto
- magic link intacto
- `/api/auth/me` intacto
- feature flag desligável sem deploy adicional se a plataforma suportar config dinâmica

---

## 14. Definition of Done deste domínio

- Google OAuth social funciona
- `/api/auth/me` reflete sessão real
- `/minha-conta` não depende mais só de identidade local
- magic link continua funcional
- rate limit distribuído é exigido em produção
- sessions server-side são exigidas em produção
- login admin não foi tocado
