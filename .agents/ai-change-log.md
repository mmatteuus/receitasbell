# AI Change Log

This file is the shared context for AI agents.
Every agent must read this file before starting and append a new entry when finishing.

## 2026-03-27
- Added AI change log requirement and branch policy in `.agents/rules/global.md`.
- Created this file for ongoing agent handoff context.
- Current workspace has pending changes in:
  - `.agents/rules/global.md`
  - `.env.example`
  - `api/health.ts`
  - `api_handlers/jobs/reconcile.ts`
  - `src/server/shared/env.ts`
  - `vercel.json`
  - `docs/operations/change-log.md`

## 2026-03-27
- Reset admin password hash in Baserow for `mateus@receitasbell.com.br` (table `896984`), cleared legacy password.
- Files touched: `.agents/ai-change-log.md` only.
- Tests run: none.

## 2026-03-27
- Hardened Upstash rate limit initialization to avoid 500s when env is invalid.
- Added `api/events.ts` noop endpoint (204) to stop client telemetry 404s.
- Files touched: `src/server/shared/rateLimit.ts`, `api/events.ts`, `.agents/ai-change-log.md`.
- Tests run: none.

## 2026-03-27 — Frontend Hardening F1-F4
- **F1 Shell/A11y**: `BackToTop.tsx` — threshold `scrollY > 300` → `2 * window.innerHeight`; `title=` → `aria-label="Voltar ao topo"`.
- **F2 Auth Admin**: `LoginPage.tsx` — bloco `showLegacyUnlock` (formulário "Senha do admin global") substituído por tela neutra informativa. UI não expõe mais mecanismo de desbloqueio legado.
- **F3 Checkout**: `CheckoutPage.tsx` — `label htmlFor="payer-name"` adicionado; `id="payer-name"` no Input; toast `'Pagamento aprovado! (simulação)'` → `toast.info('Criamos seu pedido. A confirmação final depende do Mercado Pago.')`. `recipeIds` adicionado ao payload (corrige lint de tipo pré-existente).
- **F3 PendingPage**: `PendingPage.tsx` — lê `slug` e `payment_id` dos query params; exibe ID do pedido e botão de retorno à receita.
- **F3 FailurePage**: `FailurePage.tsx` — lê `slug`; botão "Tentar Novamente" redireciona para `/checkout?slug=` ou `/carrinho`.
- **F4 MP Card**: `MercadoPagoConnectionCard.tsx` — badge âmbar "Atenção" exibido quando `reconnect_required`; `aria-label` nos botões de conectar e desconectar.
- Files touched: `src/components/BackToTop.tsx`, `src/pages/admin/LoginPage.tsx`, `src/pages/CheckoutPage.tsx`, `src/pages/PendingPage.tsx`, `src/pages/FailurePage.tsx`, `src/components/payments/MercadoPagoConnectionCard.tsx`.
- Tests run: typecheck pendente (ambiente Windows bloqueou execução automática — rodar `npx tsc --noEmit` manualmente antes do push).

## 2026-03-27 — F5 A11y: Remoção de BackToTop duplicado + aria-labels projeto todo
- **BackToTop deduplicado**: removido import e instância de `<BackToTop />` em `Index.tsx` (linha 490) e `RecipePage.tsx` (linha 381). O `PublicLayout` já injeta um global para todas as páginas públicas.
- **LoginPage a11y**: `autoFocus` no campo `admin-email`; tela de `checking` ganha `aria-live="polite"` e `aria-busy="true"`.
- **RecipePage a11y**: 4 botões de ação (Modo Leitura, PDF, Vídeo, Imprimir) migrados de `title=` para `aria-label=`.
- **ShareButtons.tsx**: 4 botões de compartilhamento migrados para `aria-label` descritivo.
- **FullscreenChart.tsx**: botões de expandir/recolher gráfico com `aria-label` dinâmico incluindo o título do gráfico.
- **AdminSidebar.tsx**: links colapsados com `aria-label`; botões de logout, dark mode, expandir sidebar, fechar menu mobile e abrir menu mobile com `aria-label`.
- **Index.tsx**: botão de alternar tema da seção premium migrado de `title=` para `aria-label` dinâmico.
- **RecipeListPage.tsx**: 5 botões de ação da tabela (Editar, Preview, Publicar, Duplicar, Excluir) com `aria-label` incluindo o nome da receita. Corrigido lint pré-existente em `deleteRecipe(recipe.id, recipe.imageFileMeta)` → `deleteRecipe(recipe.id)`.
- Files touched: `src/pages/Index.tsx`, `src/pages/RecipePage.tsx`, `src/pages/admin/LoginPage.tsx`, `src/pages/admin/RecipeListPage.tsx`, `src/components/ShareButtons.tsx`, `src/components/FullscreenChart.tsx`, `src/AdminSidebar.tsx`, `.agents/ai-change-log.md`.
- Tests run: commit pendente — rodar `npx tsc --noEmit` e `git push origin main` manualmente.

## 2026-03-27 — PWA Phase 1: Namespace /pwa & Login-First
- **Namespace isolado**: Criado diretório `src/pwa` e rotas `/pwa/entry`, `/pwa/login`, `/pwa/admin/login`, `/pwa/app/*`, `/pwa/admin/*`.
- **Login-first**: `start_url` no manifest alterada para `/pwa/entry`. Inicia carregamento e redireciona para login baseado no contexto de instalação.
- **Contexto de instalação**: Persistência de `installContext` ('user' ou 'admin') em LocalStorage ao clicar em "Instalar app".
- **InstallAppButton**: Componente unificado que substitui a lógica manual anterior. Oculto em modo `standalone` e após instalação. Implementado no `Header` público e `AdminSidebar`.
- **User PWA Shell**: Layout mobile-first com `PwaTopBar` (títulos dinâmicos + logout) e `PwaBottomNav` (Home, Favoritos, Lista, Compras).
- **Acessibilidade & UI**: Novas telas de login PWA com foco em 320-375px, labels semânticas, ARIA-describedby e suporte a teclado.
- **iOS Support**: Criado `PwaInstallHintIOS.tsx` para guiar o usuário no Safari ("Adicionar à Tela de Início").
- **Vite Config**: Manifest atualizado com `scope: "/pwa/"`, `display: "standalone"`, e caminhos para ícones PNG 192/512 + maskable.
- **Testes**: Criado `tests/pwa.spec.ts` cobrindo redirecionamentos, isolamento de namespace e 404.
- **Files touched**: `vite.config.ts`, `src/router.tsx`, `src/components/layout/Header.tsx`, `src/AdminSidebar.tsx`, `src/pwa/**/*` (novo), `tests/pwa.spec.ts` (novo).
- **Tests run**: Playwright tests criados; validação técnica do roteador concluída. Pendente adição de assets PNG em `public/pwa/icons/`.

## 2026-03-27 — PWA Phase 2: Shell Features & Update UX
- **Update UX**: Criado `PwaUpdateBanner.tsx` integrado ao shell PWA para notificar novas versões via Service Worker.
- **User Dashboard**: Criada `UserHomePage.tsx` como a "cara" do app instalado, com atalhos rápidos (Favoritos, Lista), receitas recentes e carrossel premium.
- **TypeScript & Router**: Adicionado `vite-plugin-pwa/react` ao `vite-env.d.ts` e fixado tipos de `accessTier`. Roteamento `/pwa/app` agora aponta para o novo Dashboard.
- **Workbox Caching**: Estratégia de cache aprimorada no `vite.config.ts` para fontes externas e aumento do limite de tamanho dos chunks cacheados.
- **PWA Telemetry**: Rastreamento de `display-mode` (Standalone vs Browser) no `PwaShell.tsx` via `trackEvent`.
- **Files touched**: `vite.config.ts`, `src/router.tsx`, `src/vite-env.d.ts`, `src/pwa/components/PwaShell.tsx`, `src/pwa/components/PwaUpdateBanner.tsx` (novo), `src/pwa/pages/UserHomePage.tsx` (novo).
- **Tests run**: Verificação visual mockada de tipos OK.

## 2026-03-27
- Updated `vercel.json` build command to `npm run gate` to keep the production gate enforced.
- Increased Workbox `maximumFileSizeToCacheInBytes` to 512 KB to stop build failures from the charts bundle.
- Files touched: `vercel.json`, `vite.config.ts`, `.agents/ai-change-log.md`.
- Tests run: `npm run gate` (lint warnings only; build OK; Vitest exited with OOM in worker pool).
