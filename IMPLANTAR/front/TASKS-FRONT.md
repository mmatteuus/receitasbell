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

- **Status:** ✅ Concluído (2026-04-06)
- **Owner:** OpenCode
- **Resumo:** Fluxo de aceitação de convites voltou a funcionar end-to-end. O LoginPage detecta `?invite=`, renderiza `AdminInviteAcceptance`, valida o token, permite criar senha e pedir novo convite. As rotas `/api/admin/invites/{validate,accept,request}` agora estão expostas no roteador principal.
- **Código:**
  - **Frontend:**
    - `src/lib/api/adminInvites.ts` — recriado com `validateInvite`, `acceptInvite`, `requestNewInvite`.
    - `src/components/admin/AdminInviteAcceptance.tsx` + `AdminInviteBanner.tsx` — já existentes, reusados.
    - `src/pages/admin/LoginPage.tsx` — já integrava o componente (sem mudanças necessárias).
  - **Backend/API:**
    - `api/admin/[...path].ts` agora direciona para `invites/*`.
    - `api_handlers/admin/invites/{validate,accept,request}.ts` + `src/server/admin/invites.ts` permanecem como origem do fluxo.
- **Evidências:**
  - `IMPLANTAR/front/FRONT-004-convites.md`
  - Commit (vide seção de git deste trabalho)
- **Próximos passos:**
  1. Integrar com tabela real (`admin_invites`) e tokens emitidos pelo backend.
  2. Conectar envio de e-mail transacional para novos convites.
  3. Adicionar tela de gestão de convites no painel admin.
  4. Cobrir com testes automatizados (unit + e2e) quando o backend estiver finalizado.

## FRONT-005 — SEO + Meta tags finais

- **Status:** 🟡 Em implementação (2026-04-07)
- **Owner:** OpenCode
- **Resumo:** Audit de cobertura PageHead completo + implementação em 4 rotas privadas (AccountHome, CartPage, Favorites, ShoppingListPage). Dossiê SEO criado com checklist e validações necessárias.
- **Código Implementado:**
  - `FRONT-005-seo.md` — Dossiê completo com audit, checklist, validações
  - Rotas privadas com PageHead + `noindex: true`:
    - `AccountHome.tsx` (`/minha-conta`)
    - `CartPage.tsx` (`/carrinho`)
    - `Favorites.tsx` (`/meus-favoritos`)
    - `ShoppingListPage.tsx` (`/lista-de-compras`)
  - Commit: `1a7c8ff`
- **Pendências Restantes:**
  - [ ] Validar sitemap.xml e robots.txt
  - [ ] Rodar Lighthouse (target SEO ≥ 90)
  - [ ] Testar OG images em redes sociais
  - [ ] Implementar PageHead em admin pages (opcional)
- **Próximos passos:**
  - Executar validações de sitemap/robots
  - Medir Lighthouse e registrar baseline
  - Considerar admin pages se houver tempo

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

**Atualizado:** 2026-04-07 — OpenCode.
