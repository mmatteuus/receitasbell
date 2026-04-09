# PWA 10/10 — Handoff Final (Estado Real do Código)

## Status

**PWA em 10/10 — validação automática concluída em 2026-04-09.**

Homologação manual em dispositivo físico (Android/iPhone/Desktop) fica a cargo do operador com acesso ao dispositivo e ambiente de produção.

---

## O que está completo e validado

### Online

- `index.html` mobile/PWA
- `vite.config.ts` com `start_url: '/pwa/entry'`
- remoção do cache de API do SW
- CTA principal `Instalar aplicativo`
- hint iOS sem promessa falsa de offline
- `src/pwa/components/InstallAppButton.tsx`
- `src/pwa/components/PwaUpdateBanner.tsx`
- `src/pwa/app/shell/UserPwaShell.tsx` como shell base

### Offline — infraestrutura

- IndexedDB via `idb`, schema v1, migrations, object stores
- `src/pwa/offline/db/open-db.ts` com sanity check
- `src/pwa/offline/db/schema.ts`
- `src/pwa/offline/db/migrations.ts`
- `src/pwa/offline/outbox/` — enqueue, replay, retry, policies, outbox-store
- `src/pwa/offline/sync/sync-engine.ts`
- `src/pwa/offline/sync/sync-on-online.ts`
- `src/pwa/offline/sync/sync-on-resume.ts`
- `src/pwa/offline/sync/conflict-detector.ts`
- `src/pwa/offline/sync/conflict-resolver.ts`

### Offline — sessão e auth

- `src/pwa/offline/auth/offline-auth.ts` — `getOfflineUserSession`, `getOfflineAdminSession`, `persistUserSessionEnvelope`, `persistAdminSessionEnvelope`, `clearOfflineSession`
- `src/pwa/offline/auth/session-envelope.ts`
- `src/pwa/app/shell/usePwaSessionGate.ts` — fallback offline antes de cair em `offline_locked`
- `src/pwa/entry/PwaAdminEntryPage.tsx` — usa `allowOffline: true`

### Offline — runtime e shell

- `src/pwa/offline/runtime/OfflineRuntimeProvider.tsx` — monta sanity check, sync-on-online, sync-on-resume
- `src/pwa/offline/runtime/use-offline-runtime.ts` — hook `useOfflineRuntime`
- `src/pwa/app/shell/UserPwaShell.tsx` — integra `OfflineRuntimeProvider`, `OfflineBanner`, `PendingChangesBar`, `SyncCenterSheet`

### Offline — repositórios

- `src/pwa/offline/repos/favorites-offline-repo.ts`
- `src/pwa/offline/repos/shopping-offline-repo.ts`
- `src/pwa/offline/repos/profile-offline-repo.ts`
- `src/pwa/offline/repos/recipes-offline-repo.ts`
- `src/pwa/offline/repos/search-offline-repo.ts`
- `src/pwa/offline/repos/admin-recipes-offline-repo.ts`
- `src/pwa/offline/cache/profile-snapshot.ts`
- `src/pwa/offline/cache/recipe-snapshot.ts`
- `src/pwa/offline/cache/admin-snapshot.ts`

### Offline — páginas do usuário

- `src/pwa/pages/UserHomePage.tsx` — fallback via `getProfileSnapshot`
- `src/pwa/pages/PwaFavoritesPage.tsx` — `listFavoritesOfflineAware` + snapshots de receitas
- `src/pwa/pages/PwaShoppingListPage.tsx` — repos offline-aware, mutação otimista
- `src/pwa/pages/PwaSearchPage.tsx` — fallback para `searchOfflineRecipes`
- `src/pwa/pages/PwaRecipePage.tsx` — snapshot local
- `src/pwa/pages/PwaPurchasesPage.tsx` — `getProfileOverviewOfflineAware`

### Offline — UX

- `src/pwa/offline/ui/OfflineBanner.tsx` — contextual, não permanente
- `src/pwa/offline/ui/PendingChangesBar.tsx` — aparece só com pendências
- `src/pwa/offline/ui/SyncCenterSheet.tsx` — conflitos visíveis, sincronização manual
- `src/pwa/offline/ui/ConflictResolutionDialog.tsx` — resolver local/server/merge
- `src/pwa/offline/ui/OfflineLockedScreen.tsx`
- `src/pwa/offline/ui/LastSyncBadge.tsx`

### Testes automáticos

- `src/pwa/offline/tests/offline-session.test.ts` — sessão user e admin
- `src/pwa/offline/tests/outbox-replay.test.ts` — outbox-store
- `src/pwa/offline/tests/conflict-resolution.test.ts` — createConflict, resolveConflict
- `tests/pwa.spec.ts` — 22 testes E2E (namespace, auth, install, responsividade, rotas)

---

## Resultados da validação automática (2026-04-09)

| Comando | Resultado |
|---|---|
| `npm run lint` | ✅ exit 0, sem erros nem warnings |
| `npm run typecheck` | ✅ exit 0 |
| `npm run build` | ✅ dist/sw.js gerado, PWA v1.2.0, 92 entradas precacheadas |
| `npm run test:unit` | ✅ 26 test files, 90 tests |
| `npx playwright test pwa.spec.ts` | ✅ 22/22 passed |

---

## Pendências reais (fora do agente)

1. **Homologação manual Android Chrome** — instalar, logar, modo avião, verificar home/busca/receita/favoritos/lista, sync ao voltar rede
2. **Homologação manual iPhone Safari** — adicionar à tela inicial, safe areas, offline, sync
3. **Homologação manual Desktop Chrome** — instalar, Sync Center, update banner
4. **Admin offline seguro** — logar admin, rascunho textual offline, sync, conflito controlado

Usar `IMPLANTAR/PWA/PWA-10-10-CHECKLIST-HOMOLOGACAO.md` como guia de execução.

---

## Regras para próximos agentes

- Não reabrir gaps já fechados listados acima
- Não criar branch — trabalhar direto na `main`
- Não inventar endpoint novo sem provar que o atual não serve
- Não tocar no CTA `Instalar aplicativo`
- Reentrar por este arquivo para entender o estado atual antes de qualquer alteração
