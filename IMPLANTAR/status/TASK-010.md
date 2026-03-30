# TASK-010 — Integrar frontend `/minha-conta` com Google + magic link
- **Objetivo:** oferecer botão social Google no UI sem quebrar o fluxo atual de email/magic link.
- **Arquivos-alvo:** `src/pages/AccountHome.tsx`, `src/lib/api/socialAuth.ts`.
- **Passos**
  1. Criar `src/lib/api/socialAuth.ts` com função `startSocialAuth(provider, redirectTo)` que chama `/api/auth/oauth/start` e redireciona o usuário.
  2. No `AccountHome`, adicionar botão “Continuar com Google” visível apenas quando flag `AUTH_SOCIAL_ENABLED=true` e `AUTH_SOCIAL_ALLOWED_TENANTS` autorizar.
  3. Manter o botão de email/magic link.
  4. Após retorno do Google, revalidar `/api/auth/me` e atualizar UI.
  5. Documentar no log o comportamento e as states (ex.: `redirectTo`).
- **Outputs esperados**
  - Cartela de UI com dois botões (Google e email).
  - Função API consumida com fetch JSON.
  - Screenshot ou descrição do fluxo completado (ou logs de teste manual).
- **Após concluir:** registrar no log, rodar testes relevantes e remover o arquivo.
