# PWA 10/10 — Handoff Final + Limpeza da Pasta IMPLANTAR/PWA

## 1. Escopo deste arquivo

Este é o **handoff final** para um agente IA deixar o PWA em **10/10**.

Ele concentra:

- o que já está validado como bom
- o que ainda falta no código
- a ordem de execução
- quais arquivos da pasta `IMPLANTAR/PWA` devem ser apagados por já estarem superseded

## Regra operacional

- trabalhar direto na `main`
- não criar branch
- não apagar arquivo antes de ler e absorver qualquer informação útil
- ao final, manter na pasta `IMPLANTAR/PWA` somente os dossiês finais realmente necessários

---

## 2. O que eu já validei como OK no código

## Online validado

Os itens abaixo já estão em bom estado e **não devem ser retrabalhados sem motivo real**:

- `index.html` mobile/PWA
- `vite.config.ts` com `start_url: '/pwa/entry'`
- remoção do cache de API do SW
- CTA principal `Instalar aplicativo`
- hint iOS sem promessa falsa de offline
- componente PWA `src/pwa/components/InstallAppButton.tsx`
- `src/pwa/components/PwaUpdateBanner.tsx`
- `src/pwa/app/shell/UserPwaShell.tsx` como shell base

## Offline já encaixado e validado como avanço real

Os itens abaixo **já foram integrados** e devem ser preservados:

- `src/pwa/app/shell/usePwaSessionGate.ts` com fallback offline de usuário
- `src/pwa/offline/runtime/OfflineRuntimeProvider.tsx`
- `src/pwa/pages/PwaSearchPage.tsx` com fallback para `searchOfflineRecipes`
- `src/pwa/pages/PwaRecipePage.tsx` com snapshot local
- `src/pwa/pages/PwaPurchasesPage.tsx` com `getProfileOverviewOfflineAware`
- `src/pwa/offline/repos/recipes-offline-repo.ts`
- `src/pwa/offline/repos/search-offline-repo.ts`
- `src/pwa/offline/ui/OfflineBanner.tsx`
- `src/pwa/offline/ui/PendingChangesBar.tsx`
- `src/pwa/offline/ui/SyncCenterSheet.tsx`
- `src/pwa/offline/sync/sync-engine.ts`
- `src/pwa/offline/sync/sync-on-online.ts`
- `src/pwa/offline/sync/sync-on-resume.ts`

## Importante

Não reabrir trabalho já bom só por estética. O foco agora é fechar os **gaps que ainda impedem 10/10**.

---

## 3. O que ainda falta para 10/10

## Gap 1 — Home PWA ainda não está realmente offline-aware

### Arquivo principal

- `src/pwa/pages/UserHomePage.tsx`

### Problema

A home ainda usa `usePublicRecipes()` como fonte principal e não mostra fallback offline explícito de valor equivalente.

### O que fazer

- integrar fallback offline via snapshot/local repo
- garantir que a home instalada abra com conteúdo útil mesmo sem rede
- usar overview local + receitas já sincronizadas/recentes
- manter sensação de aplicativo, não de tela vazia

### Critério de aceite

- home PWA exibe conteúdo útil offline após uso prévio online

---

## Gap 2 — Favoritos ainda não estão fechados no nível do PWA offline

### Arquivo principal

- `src/pages/Favorites.tsx` ou a superfície PWA equivalente usada em `/pwa/app/favoritos`

### Problema

A tela atual ainda parece usar fluxo web/contexto, enquanto o repositório offline-aware de favoritos já existe.

### O que fazer

- confirmar qual tela está sendo usada no namespace `/pwa/app/favoritos`
- fazer a superfície PWA consumir repo offline-aware
- garantir leitura local dos favoritos + sincronização posterior
- se necessário, criar variante PWA dedicada em vez de reaproveitar a tela web sem adaptação

### Critério de aceite

- favoritos abrem e continuam funcionando sem rede

---

## Gap 3 — Lista de compras ainda não está fechada no nível do PWA offline

### Arquivo principal

- `src/pages/ShoppingListPage.tsx` ou a superfície PWA equivalente usada em `/pwa/app/lista-de-compras`

### Problema

A tela atual ainda usa chamadas diretas de API (`listShoppingList`, `createShoppingListItems`, etc.), enquanto o repo offline-aware já existe.

### O que fazer

- confirmar qual tela está sendo usada no namespace `/pwa/app/lista-de-compras`
- trocar a superfície PWA para fluxo offline-aware
- garantir create/update/delete local + replay automático
- refletir pending changes no shell sem ruído exagerado

### Critério de aceite

- lista de compras funciona plenamente offline e sincroniza depois

---

## Gap 4 — Sessão offline admin ainda não está fechada no mesmo nível do user

### Arquivos principais

- `src/pwa/entry/PwaAdminEntryPage.tsx`
- `src/pwa/offline/auth/offline-auth.ts`
- shell/admin gate correspondente

### Problema

O envelope admin existe, mas a experiência/admin offline ainda não está fechada no boot principal do mesmo jeito que user offline começou a ficar.

### O que fazer

- integrar `getOfflineAdminSession()` no fluxo admin correto
- manter escopo admin offline seguro e restrito
- bloquear apenas o que não for seguro offline
- permitir snapshots e drafts onde já houver base real

### Critério de aceite

- admin com sessão válida consegue abrir superfícies offline seguras

---

## Gap 5 — UX de conflito ainda precisa fechamento real

### Arquivos principais

- `src/pwa/offline/hooks/useConflictCenter.ts`
- `src/pwa/offline/ui/SyncCenterSheet.tsx`
- criar `src/pwa/offline/ui/ConflictResolutionSheet.tsx` se ainda não existir

### Problema

A base de conflitos existe, mas a resolução completa ainda não está claramente fechada na experiência.

### O que fazer

- expor conflitos pendentes no Sync Center
- permitir resolver conflito com escolha clara
- religar sync após resolução
- não deixar conflito invisível nem sem saída

### Critério de aceite

- conflito aparece, é resolvido e não trava o app

---

## Gap 6 — Testes ainda não provam 10/10

### Arquivos principais

- `tests/pwa.spec.ts`
- criar suíte offline dedicada se ainda não existir

### O que fazer

- manter `tests/pwa.spec.ts` coerente com a UI real atual
- criar testes offline dedicados para:
  - sessão offline válida
  - boot offline
  - favoritos offline
  - lista offline
  - replay/outbox
  - conflito
  - sync ao voltar rede

### Critério de aceite

- o PWA é provado por testes, não por impressão

---

## 4. O que eu não consegui fazer daqui

## Limitação objetiva do ambiente

Neste ambiente eu **não consegui editar/apagar arquivos de código rastreados existentes** diretamente pelo conector atual.

### Por isso

- eu validei o estado atual
- eu confirmei o que já está bom
- eu concentrei aqui o restante do trabalho
- a execução final no código deve ser feita pelo agente executor

> Não perder tempo reavaliando o que já está marcado acima como OK sem um motivo técnico concreto.

---

## 5. Ordem obrigatória de execução do agente

1. Ler este arquivo inteiro.
2. Ler `IMPLANTAR/PWA/PWA-OFFLINE-DOSSIE-COMPLETO.md` para detalhes offline profundos.
3. Fechar `UserHomePage.tsx` em modo offline-aware.
4. Fechar favoritos PWA em modo offline-aware.
5. Fechar lista de compras PWA em modo offline-aware.
6. Fechar sessão/admin offline em escopo seguro.
7. Fechar UX de conflito e resolução.
8. Fechar testes automáticos.
9. Rodar validações automáticas e manuais.
10. Só então limpar a pasta `IMPLANTAR/PWA`.

---

## 6. Arquivos da pasta IMPLANTAR/PWA que o agente deve apagar ao final

## Apagar estes arquivos por estarem superseded / já absorvidos

### Dossiê online antigo

- `IMPLANTAR/PWA/00-INDICE-DOSSIE-PWA-ONLINE.md`
- `IMPLANTAR/PWA/01-PRD-PWA-ONLINE.md`
- `IMPLANTAR/PWA/02-TAREFAS-EXECUTAVEIS-PWA-ONLINE.md`
- `IMPLANTAR/PWA/03-PATCHES-PENDENTES-PWA-ONLINE.md`
- `IMPLANTAR/PWA/04-CHECKLIST-VALIDACAO-PWA-ONLINE.md`
- `IMPLANTAR/PWA/05-NAO-FAZER-NESTA-FASE-ONLINE.md`
- `IMPLANTAR/PWA/06-RESUMO-PARA-O-AGENTE-EXECUTOR.md`

### Dossiê online intermediário 10/10

- `IMPLANTAR/PWA/PWA-ONLINE-10-10-INDICE.md`
- `IMPLANTAR/PWA/PWA-ONLINE-10-10-AUDITORIA-FINAL.md`
- `IMPLANTAR/PWA/PWA-ONLINE-10-10-TAREFAS-RESTANTES.md`
- `IMPLANTAR/PWA/PWA-ONLINE-10-10-PATCHES-RESTANTES.md`
- `IMPLANTAR/PWA/PWA-ONLINE-10-10-VALIDACAO-OBRIGATORIA.md`
- `IMPLANTAR/PWA/PWA-ONLINE-10-10-LIMITES-E-RISCOS.md`
- `IMPLANTAR/PWA/PWA-ONLINE-10-10-HANDOFF-FINAL.md`

## Manter

- `IMPLANTAR/PWA/PWA-OFFLINE-DOSSIE-COMPLETO.md`
- `IMPLANTAR/PWA/PWA-10-10-FINAL-HANDOFF.md`

> Se o agente gerar um novo dossiê final consolidado melhor do que este, ele pode manter só:
>
> - `PWA-10-10-FINAL-HANDOFF.md`
> - `PWA-OFFLINE-DOSSIE-COMPLETO.md`
>
> ou substituir por um único consolidado, desde que não perca informação importante.

---

## 7. Checklist final para chamar de 10/10

- home PWA útil offline
- favoritos PWA úteis offline
- lista de compras PWA útil offline
- receitas e busca offline funcionando
- compras/desbloqueios offline funcionando
- sessão offline user funcionando
- sessão offline admin segura funcionando
- conflitos resolvíveis pela UI
- sync automático e manual funcionando
- shell continua app-like
- testes automáticos cobrindo online + offline
- validação manual Android/iPhone/Desktop concluída
- pasta `IMPLANTAR/PWA` limpa dos arquivos superseded

---

## 8. Encerramento esperado do agente

Ao concluir, o agente deve devolver:

1. lista dos arquivos de código alterados
2. lista dos arquivos da pasta `IMPLANTAR/PWA` apagados
3. resumo do que foi concluído
4. saída de lint/typecheck/build/testes
5. evidências manuais
6. confirmação explícita de que o PWA chegou em **10/10**
