# TASK-009 — Implementar backend OAuth social
- **Objetivo:** desenvolver handlers para `oauth-start` e `oauth-callback`, persistir states e criar sessões monitoradas.
- **Arquivos-alvo:** `src/server/auth/social/providers.ts`, `state.ts`, `repo.ts`, `service.ts`, `start.ts`, `callback.ts`, `api_handlers/auth/oauth-start.ts`, `api_handlers/auth/oauth-callback.ts`.
- **Passos**
  1. Criar registro de providers (`SOCIAL_PROVIDERS`) com Google e URLs/token URLs do runbook.
  2. Desenvolver persistência de state hashed e consumo único (`createOpaqueState`, `hashOpaqueState`, `saveAuthOAuthState`, `consumeValidAuthOAuthState`).
  3. Implementar `startSocialOAuth` (gera state, grava hash, retorna `authorizationUrl`).
  4. Implementar `finishGoogleOAuth` (valida state, troca `code` por token, busca profile, exige `email_verified`, resolve/cria user/identidade, cria sessão com `createSession()`).
  5. Criar os `api_handlers` que encapsulam a lógica e aplicam rate limit/distribuição (use o token e envs definidas).
  6. Garantir que o fluxo usa feature flag `AUTH_SOCIAL_ENABLED` e honre `AUTH_SOCIAL_ALLOWED_TENANTS`.
- **Outputs esperados**
  - Novos arquivos em `src/server/auth/social/`.
  - Handlers `api_handlers/auth/oauth-start.ts` e `oauth-callback.ts` que respondem com o JSON descrito no runbook.
  - Logs de execuções locais (`npm run lint`, `npm run test:unit`).
- **Após concluir:** logar os endpoints, adicionar notas sobre rate limiting e apagar o arquivo.
