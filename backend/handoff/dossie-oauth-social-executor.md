# Dossiê Executivo — Receitas Bell

**Escopo:** implementar autenticação social do usuário final com **Google como primeiro provider**, mantendo **magic link** como fallback e **sem tocar no login administrativo**.

**Projeto:** Receitas Bell  
**Trilha:** **B — Evoluir existente**  
**Assinatura:** [Desenvolvido por MtsFerreira](https://mtsferreira.dev)

---

## 1. Resumo executivo

O backend já possui multi-tenant, sessões próprias, magic links, readiness, rate limit e integrações com Mercado Pago/Stripe. A implementação correta de social auth deve **reaproveitar sessões server-side existentes**, criar **storage dedicado para identidades sociais** e criar **storage dedicado para states OAuth sociais**. O rollout deve ser **por tenant**, sob **feature flag**, sem alterar o fluxo admin.

### Achado crítico imediato
O deploy atual está quebrado por **merge conflict commitado** em `src/server/integrations/mercadopago/client.ts`. Corrigir isso é a **primeira tarefa obrigatória** antes de qualquer outra mudança.

---

## 2. Auditoria objetiva

### FATO
- O projeto roda em **TypeScript + Node + Vite + Vercel**.
- O sistema é **multi-tenant**.
- Há sessões server-side com fallback stateless.
- Há fluxo de **magic link** para usuário final.
- Há login admin isolado.
- Há OAuth em domínio de pagamentos.
- O build da produção atual falha por parsing error em arquivo com merge conflict.

### SUPOSIÇÃO
- A funcionalidade solicitada continua sendo **OAuth social do usuário final**, começando por Google.

### [PENDENTE]
- Validar workflow CI com scans de segurança, se existir.
- Validar tipo real da coluna `expiresAt` da tabela `magic_links` antes de alterar a semântica de expiração.

---

## 3. Principais achados P0–P3

### P0 — Merge conflict no cliente Mercado Pago quebra o build
**Onde:** `src/server/integrations/mercadopago/client.ts`

**Causa:** marcador `<<<<<<< HEAD` commitado.

**Impacto:** `npm run gate` falha; produção não sobe.

**Correção exata**
Manter apenas um export compatível com `src/server/integrations/mercadopago/methods.ts`, que importa `mpGetPaymentMethods`.

**Patch sugerido**
```ts
export async function mpGetPaymentMethods(accessToken: string): Promise<MercadoPagoPaymentMethod[]> {
  const response = await mpFetch("https://api.mercadopago.com/v1/payment_methods", {
    headers: authHeaders(accessToken),
  }, 1);

  if (!response.ok) {
    const payload = await parseJsonSafe(response);
    throw new MercadoPagoApiError(
      response.status,
      `MP get payment methods failed ${response.status}`,
      payload,
    );
  }

  try {
    const data = await response.json();
    return Array.isArray(data) ? (data as MercadoPagoPaymentMethod[]) : [];
  } catch {
    return [];
  }
}
```

**Critério de aceite**
- `npm run lint` passa
- `npm run gate` deixa de falhar por parsing error

---

### P0 — Não existe tabela dedicada para identidades sociais
**Criar:** `user_identities_social`

**Campos mínimos**
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

**Regra**
- unique lógico por `tenant_id + provider + provider_subject`

---

### P0 — Não existe tabela dedicada para states OAuth sociais
**Criar:** `auth_oauth_states`

**Campos mínimos**
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

**Regra**
- `state_hash` one-time
- expiração curta (10 min)
- consumo atômico antes da troca de token

---

### P1 — Social auth não pode usar fallback memory de rate limit em produção
**Problema:** social auth em ambiente serverless não pode degradar para memória local.

**Correção**
- para `/api/auth/oauth/start` e `/api/auth/oauth/callback`, se backend != Upstash em produção, responder `503`

---

### P1 — Social auth não pode usar fallback stateless de sessão em produção
**Problema:** login social precisa de revogação/auditoria consistentes.

**Correção**
- bloquear conclusão do login social se `BASEROW_TABLE_SESSIONS` não estiver configurada ou acessível

---

### P1 — Magic link pode estar expirando no fim do dia, não em 15 minutos
**Problema:** o código gera prazo de 15 min, mas persiste data sem hora.

**Ação**
- não mexer sem validar schema
- criar tarefa específica de correção com expand-contract, se necessário

---

### P1 — Divergência de versão Node entre projeto Vercel e package
**Problema:** Vercel project em `24.x`, `package.json` fixa `20.x`.

**Ação**
- alinhar Vercel project settings para o mesmo runtime do `package.json`

---

### P2 — Dependências com vulnerabilidades reportadas no build
**Ação**
- rodar `npm audit`
- classificar por pacote
- atualizar sem `--force` nesta primeira passada

---

## 4. Arquitetura proposta

### Novos arquivos
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

### Regras duras
- **Não tocar** no login admin nesta fase.
- **Manter** magic link como fallback.
- **Criar sessão** com `createSession()` já existente.
- **Não salvar** token do provider no cliente.
- **Não confiar** em `userId` vindo do frontend.
- **Resolver tenant** no backend em todo o fluxo.

### Provider inicial
```ts
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

## 5. Contratos HTTP

### `POST /api/auth/oauth/start`
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

### `GET /api/auth/oauth/callback?provider=google&code=...&state=...`
**Fluxo**
1. resolver tenant
2. validar state
3. consumir state one-time
4. trocar `code` por token
5. buscar profile
6. exigir `email_verified=true`
7. resolver/criar vínculo provider↔user
8. criar sessão server-side
9. redirecionar

### `GET /api/auth/me`
Manter, opcionalmente enriquecendo com `provider`.

---

## 6. Implementação por fases

### Fase 0 — Destravar produção
1. Corrigir merge conflict em `src/server/integrations/mercadopago/client.ts`
2. Rodar:
```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run gate
```
3. Validar preview deployment

### Fase 1 — Preparar env e schema
Adicionar ao `.env.example` e ao parser de env:
```env
AUTH_SOCIAL_ENABLED=false
AUTH_SOCIAL_ALLOWED_TENANTS=
GOOGLE_OAUTH_CLIENT_ID=UNSPECIFIED
GOOGLE_OAUTH_CLIENT_SECRET=UNSPECIFIED
GOOGLE_OAUTH_REDIRECT_URI=UNSPECIFIED
BASEROW_TABLE_AUTH_OAUTH_STATES=UNSPECIFIED
BASEROW_TABLE_USER_IDENTITIES=UNSPECIFIED
```

### Fase 2 — Backend social auth
Criar:
- `providers.ts`
- `state.ts`
- `repo.ts`
- `service.ts`
- `start.ts`
- `callback.ts`
- `api_handlers/auth/oauth-start.ts`
- `api_handlers/auth/oauth-callback.ts`

### Fase 3 — Frontend `/minha-conta`
- adicionar botão **Continuar com Google** sob feature flag
- manter **Continuar com e-mail**
- após callback, revalidar `/api/auth/me`

### Fase 4 — Observabilidade, testes e rollout
- unit + integration + e2e
- OpenAPI
- runbooks
- rollout por tenant allowlist

---

## 7. Testes obrigatórios

### Unit
- state expira
- state replay falha
- provider email não verificado falha
- vínculo existente é reutilizado

### Integration
- `oauth-start` gera URL válida
- `oauth-callback` cria sessão
- `/api/auth/me` retorna usuário autenticado

### Smoke
```bash
npm run test:smoke
```

### Gate completo
```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
npm run test:smoke
```

---

## 8. Observabilidade e operação

### Logs mínimos
- `auth.oauth.start`
- `auth.oauth.callback_success`
- `auth.oauth.callback_failed`
- `auth.oauth.user_linked`
- `auth.oauth.user_created`

### Campos mínimos
- `action`
- `provider`
- `tenantId`
- `requestId`
- `latencyMs`
- `outcome`
- `reason`

### Rollout
1. `AUTH_SOCIAL_ENABLED=true`
2. `AUTH_SOCIAL_ALLOWED_TENANTS=tenant-interno`
3. validar
4. expandir por tenant

### Rollback
```bash
# rollback imediato por configuração
AUTH_SOCIAL_ENABLED=false

# se necessário, revert de código
git revert HEAD
```

---

## 9. Problemas futuros já previstos

### 3 meses
- redirect URI errada por ambiente
- replay de callback
- Redis indisponível
- duplicação por heurística de e-mail

### 1 ano
- crescimento de identidades sem índice adequado
- coexistência confusa entre social auth, magic link e admin auth
- custo de consultas no Baserow

### 3 anos
- necessidade de conta global multi-tenant
- compliance mais rígida
- múltiplos providers exigindo unlink/merge de conta

---

## 10. Handoff imperativo para o executor

1. Corrija o merge conflict de `src/server/integrations/mercadopago/client.ts`.
2. Rode `npm run gate`. Não avance enquanto falhar.
3. Atualize `.env.example` e `src/server/shared/env.ts` com as envs de social auth.
4. Crie as tabelas `auth_oauth_states` e `user_identities_social`.
5. Crie `src/server/auth/social/providers.ts`.
6. Crie `src/server/auth/social/state.ts`.
7. Crie `src/server/auth/social/repo.ts`.
8. Crie `src/server/auth/social/service.ts`.
9. Crie `src/server/auth/social/start.ts`.
10. Crie `src/server/auth/social/callback.ts`.
11. Crie `api_handlers/auth/oauth-start.ts`.
12. Crie `api_handlers/auth/oauth-callback.ts`.
13. Integre `src/pages/AccountHome.tsx` com botão social sob flag.
14. Preserve magic link como fallback.
15. Bloqueie social auth sem Redis distribuído em produção.
16. Bloqueie social auth sem `Sessions` em produção.
17. Crie testes unitários, integração e E2E.
18. Gere OpenAPI e runbooks.
19. Faça rollout por tenant allowlist.
20. Se a taxa de erro subir > 0,5%, desligue a flag e reverta.

**Fim.**
