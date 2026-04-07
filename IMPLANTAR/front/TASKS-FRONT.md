# 📘 Detalhamento — Tarefas de Front-End

## FRONT-001 — Corrigir 404 em `/t/receitasbell`

- **Status:** ✅ Concluído (2026-04-06)
- **Owner:** OpenCode
- **Resumo:** Tenant principal não era resolvido → rota passava slug inválido para API. Foi criado `TASK-003-fix-404.md`, executado script `create-tenant.mjs` e validado endpoint `/api/settings` com header `X-Tenant-Slug: receitasbell`.
- **Código:** `src/router.tsx`, `src/server/tenancy/*`.
- **Evidências:** Commit `3572aea`, MSG-OUT-OC-03.

## FRONT-002 — Fluxo robusto de recuperação de senha

- **Status:** ✅ Concluído (2026-04-06)
- **Owner:** OpenCode
- **Resumo:** Validadores Zod no client (`src/lib/validation/identity.ts`) e no server (`api_handlers/auth/update-password.ts`). Paginas `ForgotPasswordPage` e `ResetPasswordPage` agora exibem feedback claro e inputs acessíveis.
- **Evidências:** Commit `5683e20`, MSG-OUT-CC-02, `scripts/reset-admin-password.mjs` para auditoria.

## FRONT-003 — CTA de instalação PWA reforçado

- **Status:** ✅ Concluído (2026-04-06)
- **Owner:** OpenCode
- **Resumo:** `AccountHome` recebeu card destacado, `PwaInstallHintIOS` ganhou layout com passos, gradiente e copy persuasiva.
- **Evidências:** Commit `4fc602b`, MSG-OUT-CC-03.

## FRONT-004 — Validação de convites admin

- **Status:** ✅ Implementado (2026-04-06)
- **Owner:** OpenCode
- **Resumo:** Implementação completa do fluxo de aceitar convites admin com validação de token, criação de senha e integração ao LoginPage. Backend com endpoints validate, accept e request. Telemetry e audit logging integrados.
- **Código:**
  - **Frontend:**
    - `src/lib/api/adminInvites.ts` — API client
    - `src/components/admin/AdminInviteBanner.tsx` — Banner com estados
    - `src/components/admin/AdminInviteAcceptance.tsx` — Formulário
    - `src/pages/admin/LoginPage.tsx` — Integração
  - **Backend:**
    - `src/server/admin/invites.ts` — Serviço
    - `api_handlers/admin/invites/{validate,accept,request}.ts` — Endpoints
- **Evidências:** 
  - Commit `f389dc9` + `TEST-FRONT-004.md`
  - Documentação em `FRONT-004-convites.md`
- **Próximos passos:**
  1. Integrar com Supabase: criar tabela `admin_invites` com geração real de tokens.
  2. Implementar envio de email com link de convite.
  3. Dashboard de gerenciamento de convites (novo endpoint `/admin/invites`).
  4. Testes automatizados (component + E2E).

## FRONT-005 — SEO + Meta tags finais

- **Status:** 🟡 Pendente
- **Owner:** (vago)
- **Contexto:** `CAIXA-DE-ENTRADA` e `MSG-OUT-OC-07` citam ajustes finais de SEO (sufixo de título, `noindex` em PWA, OG tags).
- **Pendências identificadas:**
  - Garantir `PageHead` com título descritivo + `siteName` em todas as rotas públicas e PWA.
  - Revisar meta description, OG image e canonical tags (principal `/t/:tenant` e `/`).
  - Validar sitemap/robots.
- **Próximos passos:**
  - Criar checklist `FRONT-005-seo.md` listando cada rota.
  - Rodar Lighthouse focado em SEO e registrar métricas.

## FRONT-006 — Checklist de experiência PWA

- **Status:** 🟡 Pendente
- **Owner:** (vago)
- **Motivação:** Após reforçar CTA, precisamos medir adesão e polir onboarding (ex.: instruções offline, fallback de ícones, toasts de instalação).
- **Escopo sugerido:**
  1. Mapa de estados (não instalado, instalável, instalado).
  2. Instrumentar evento (ex.: `window.addEventListener('appinstalled', ...)` → enviar para analytics/log).
  3. Criar doc `FRONT-006-pwa.md` com dados de adesão e hipóteses de experimentos.
  4. Planejar testes (ex.: banners, modais contextuais).

---

**Atualizado:** 2026-04-06 — OpenCode.
