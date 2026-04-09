# PRD/Handoff Completo — PWA OFFLINE

## 1. Missão desta fase

Transformar o PWA já existente em uma experiência **offline real**, com sensação de aplicativo nativo mobile.

### Objetivo de UX

O usuário **não deve precisar pensar em online/offline** para usar o app no dia a dia.

O comportamento desejado é:

- o app abre rápido
- o app continua utilizável sem internet
- dados relevantes já vistos continuam acessíveis
- mudanças locais continuam funcionando e são sincronizadas depois
- conflitos não quebram a experiência
- o usuário sente que está usando um aplicativo, não um site com fallback

### Regra de linguagem

O app não deve forçar linguagem técnica para o usuário.

Evitar UX binária do tipo:

- “você está no modo offline” o tempo todo
- “recurso indisponível por falta de internet” em excesso
- telas travadas desnecessariamente

O status de rede só deve aparecer quando:

- houver risco real de perda de contexto
- existir alteração pendente
- houver conflito ou falha de sincronização
- um fluxo realmente não puder prosseguir offline

---

## 2. FATO / SUPOSIÇÃO / [PENDENTE]

## FATO

### Base offline já existente no repositório

O projeto **já possui infraestrutura offline parcial** em `src/pwa/offline/*`.

Elementos já existentes:

- IndexedDB via `idb`
- schema offline versionado
- migrations iniciais
- object stores para sessão, snapshots, outbox e conflitos
- session envelope para usuário e admin
- outbox com replay
- políticas de retry e next retry
- resolução inicial de conflito
- hooks de status offline/sync/conflito
- componentes de UI para banner, sync center, pending bar e locked screen
- repositórios offline-aware para favoritos, lista de compras, overview de perfil e rascunho de receita admin
- listeners de sync on online e sync on resume

### Estruturas já presentes

#### IndexedDB stores já definidos

- `session_envelopes`
- `favorites`
- `shopping_items`
- `profile_snapshots`
- `recipe_snapshots`
- `admin_recipe_drafts`
- `admin_snapshots`
- `outbox`
- `conflicts`

#### Fluxos já parcialmente preparados

- favoritos offline-aware
- lista de compras offline-aware
- snapshot de perfil/compras/desbloqueios
- rascunho offline de receita admin
- replay de operações por entidade
- conflito para rascunho admin
- sessão offline com TTL por envelope

### Gaps objetivos observáveis

- o gate atual do PWA ainda cai em `offline_locked` sem usar de forma efetiva o fallback de sessão offline
- a infraestrutura de sync parece existir, mas não há evidência suficiente de que já esteja montada no shell principal
- a UI de sync/offline parece existir, mas não há evidência suficiente de integração completa no fluxo principal
- a paridade offline de busca, home, compras e páginas de receita ainda não está fechada na experiência final
- não há evidência suficiente de suporte offline para upload binário de mídia em rascunho admin
- não há evidência suficiente de suíte automática offline completa validando modo avião e replay

## SUPOSIÇÃO

- o executor terá acesso completo ao código local e poderá rodar testes, build e validações reais em dispositivo
- os endpoints atuais já aceitam os cabeçalhos e contratos mínimos usados no replay offline onde o código já os envia
- o objetivo principal de offline deve priorizar **app do usuário** e **admin em escopo restrito e seguro**, não paridade total irresponsável para qualquer tela
- a experiência offline deve ser **invisível por padrão**, com status apenas contextual

## [PENDENTE]

- validar no código local se `OfflineBanner`, `PendingChangesBar`, `SyncCenterSheet`, `attachSyncOnOnline` e `attachSyncOnResume` já estão montados em algum provider/shell
- validar como `MediaSection` e upload de imagem funcionam hoje para saber se mídia offline admin terá fila de blob local ou será bloqueada temporariamente
- validar se os endpoints de update/create/delete usados no replay suportam de fato idempotência e conflito do jeito esperado no ambiente real
- validar se há cobertura real de dados suficiente para busca offline local sem baixar payload excessivo

---

## 3. Diagnóstico Offline Atual

Classificar cada eixo como `OK`, `PARCIAL` ou `AUSENTE`.

| Eixo | Status | Leitura objetiva |
|---|---|---|
| Infra IndexedDB | OK | schema, stores e migrations já existem |
| Sessão offline | PARCIAL | envelopes existem, gate principal ainda não usa bem o fallback |
| Cache de snapshots | PARCIAL | profile/recipe/admin snapshots existem, mas integração de UX parece incompleta |
| Outbox | OK | enqueue/replay/retry já existem |
| Sync automático | PARCIAL | listeners existem, integração principal ainda precisa confirmação e encaixe |
| Conflitos | PARCIAL | base existe, UX de resolução ainda precisa ser fechada |
| UX offline invisível | AUSENTE | peças existem, sensação final ainda não está consolidada |
| Offline do usuário | PARCIAL | favoritos/lista/perfil têm base; páginas finais ainda precisam encaixe |
| Offline de receitas | PARCIAL | snapshots existem; consumo nas telas precisa ser fechado |
| Offline de busca | AUSENTE | precisa busca local nos snapshots |
| Offline de compras/desbloqueios | PARCIAL | snapshot existe; UX precisa expor isso |
| Offline admin | PARCIAL | drafts/snapshots existem, mas escopo e UX precisam ser fechados |
| Mídia offline admin | [PENDENTE] | não há evidência suficiente de persistência local binária |
| Testes offline | AUSENTE | falta plano e suíte de validação robusta |
| Modo avião real | AUSENTE | precisa validação explícita |

---

## 4. Objetivo do PWA Offline

## Resultado final esperado

### App do usuário

O usuário autenticado deve conseguir, mesmo sem internet:

- abrir o app instalado
- entrar diretamente no app se houver sessão offline válida
- ver home e dados pessoais essenciais já sincronizados
- ver favoritos
- adicionar e remover favoritos
- ver lista de compras
- criar, editar e excluir itens da lista de compras
- abrir receitas já vistas/sincronizadas
- ver receitas desbloqueadas já salvas
- buscar dentro do catálogo local disponível no dispositivo
- continuar usando o app sem sensação de travamento ou quebra

### Admin

O admin deve conseguir, em escopo seguro:

- abrir o app se houver envelope admin válido e dentro do TTL permitido
- ver snapshot offline do painel em modo leitura quando existir
- abrir e continuar rascunho local de receita
- editar rascunho textual offline
- sincronizar depois

### Fora do escopo offline seguro

Não forçar offline total onde isso quebraria consistência.

Exemplos que devem ser **restritos ou read-only** se não houver base segura:

- pagamentos e transações em tempo real
- métricas ao vivo
- qualquer mutação que dependa de media upload não persistida localmente

---

## 5. Arquitetura Offline Alvo

## Namespace principal

Manter o namespace existente:

- `src/pwa/*`
- `src/pwa/offline/*`

## Organização recomendada dentro do código

Manter e completar esta malha:

```txt
src/pwa/offline
  /auth
  /cache
  /db
  /hooks
  /outbox
  /repos
  /sync
  /ui
  /runtime
  /tests
```

### Regras arquiteturais

- UI não conversa direto com IndexedDB sem passar por repo/hook especializado
- replay de outbox continua centralizado
- conflitos continuam centralizados
- shell principal controla percepção de offline/sync
- páginas consomem repo offline-aware, não chamam API “crua” diretamente quando houver variante offline

## Camada central a ser fechada

Criar ou completar um **Offline Runtime Provider** no PWA principal.

### Responsabilidades desse provider

- rodar sanity check do DB
- anexar `attachSyncOnOnline()`
- anexar `attachSyncOnResume()`
- observar sessão offline válida
- expor contexto de sync para UI
- montar Sync Center quando necessário
- evitar que cada tela resolva offline de forma isolada

### Sugestão de arquivo

- `src/pwa/offline/runtime/OfflineRuntimeProvider.tsx`

Se já existir equivalente no projeto local, reutilizar. Não duplicar.

---

## 6. Arquivos que devem ser criados/alterados

## Arquivos existentes que devem ser revisados/alterados

- `src/pwa/app/shell/usePwaSessionGate.ts`
- `src/pwa/app/shell/UserPwaShell.tsx`
- `src/pwa/entry/PwaEntryPage.tsx`
- `src/pwa/entry/PwaAdminEntryPage.tsx`
- `src/pwa/pages/UserHomePage.tsx`
- `src/pwa/pages/PwaSearchPage.tsx`
- `src/pwa/pages/PwaRecipePage.tsx`
- `src/pwa/pages/PwaPurchasesPage.tsx`
- `src/pages/Favorites.tsx` ou variante PWA equivalente
- `src/pages/ShoppingListPage.tsx` ou variante PWA equivalente
- `src/pwa/offline/auth/offline-auth.ts`
- `src/pwa/offline/repos/profile-offline-repo.ts`
- `src/pwa/offline/repos/favorites-offline-repo.ts`
- `src/pwa/offline/repos/shopping-offline-repo.ts`
- `src/pwa/offline/repos/admin-recipes-offline-repo.ts`
- `src/pwa/offline/ui/OfflineBanner.tsx`
- `src/pwa/offline/ui/PendingChangesBar.tsx`
- `src/pwa/offline/ui/SyncCenterSheet.tsx`
- `src/pwa/offline/ui/OfflineLockedScreen.tsx`
- `src/pwa/offline/hooks/useOfflineStatus.ts`
- `src/pwa/offline/hooks/usePendingSyncCount.ts`
- `src/pwa/offline/hooks/useConflictCenter.ts`
- `src/pwa/offline/sync/sync-engine.ts`
- `src/pwa/offline/sync/sync-on-online.ts`
- `src/pwa/offline/sync/sync-on-resume.ts`

## Arquivos novos recomendados

- `src/pwa/offline/runtime/OfflineRuntimeProvider.tsx`
- `src/pwa/offline/runtime/offline-shell-layout.ts`
- `src/pwa/offline/repos/recipes-offline-repo.ts`
- `src/pwa/offline/repos/search-offline-repo.ts`
- `src/pwa/offline/cache/recipe-snapshot.ts` (se ainda não estiver completo no código local)
- `src/pwa/offline/cache/admin-snapshot.ts` (se ainda não estiver completo no código local)
- `src/pwa/offline/outbox/policies.ts` (se precisar completar políticas reais)
- `src/pwa/offline/ui/ConflictResolutionSheet.tsx`
- `src/pwa/offline/ui/SyncToastBridge.tsx`
- `src/pwa/offline/tests/offline-session.spec.ts`
- `src/pwa/offline/tests/outbox-replay.spec.ts`
- `src/pwa/offline/tests/conflict-resolution.spec.ts`
- `tests/pwa-offline.spec.ts`

> Reaproveitar qualquer arquivo já existente antes de criar outro.

---

## 7. Rotas, navegação e fluxos críticos offline

## Fluxo crítico 1 — abertura offline com sessão válida

### Objetivo

Se o usuário já entrou antes e o envelope offline for válido, o app deve abrir normalmente mesmo sem rede.

### Hoje

O gate atual ainda prioriza `fetchMe()` e tende a cair em `offline_locked` quando não há conexão.

### Decisão

Alterar `usePwaSessionGate.ts` para:

1. tentar `fetchMe()` online
2. em sucesso, persistir envelope offline atualizado
3. em falha offline, consultar `getOfflineUserSession()` e `getOfflineAdminSession()`
4. se houver envelope válido, entrar como autenticado offline
5. só cair em locked screen quando não houver envelope válido ou o TTL estiver vencido

### Critério de aceite

- usuário autenticado previamente abre o app em modo avião
- admin autenticado previamente abre o app dentro do TTL admin permitido

---

## Fluxo crítico 2 — mutações offline invisíveis

### Objetivo

Favoritos e lista de compras devem continuar funcionando sem internet.

### Decisão

- manter mutação otimista local
- gravar operação no outbox
- refletir resultado imediatamente na UI
- sincronizar em segundo plano quando a conexão voltar
- exibir status apenas se houver pendência, falha ou conflito

### Critério de aceite

- favoritar/desfavoritar funciona offline
- adicionar/editar/excluir item da lista funciona offline
- a UI não trava nem pede rede para essas ações

---

## Fluxo crítico 3 — leitura offline de conteúdo

### Objetivo

Receitas, desbloqueios e visão geral devem continuar acessíveis com dados salvos.

### Decisão

- usar `profile_snapshots` para home/compras/unlocked
- usar `recipe_snapshots` para páginas de receita já vistas e desbloqueadas
- implementar busca local sobre snapshots disponíveis

### Critério de aceite

- receitas previamente sincronizadas abrem offline
- busca local retorna itens do cache local
- compras/desbloqueios aparecem com último estado sincronizado

---

## Fluxo crítico 4 — admin draft offline

### Objetivo

Permitir continuidade de edição de receita admin mesmo sem internet.

### Decisão

- persistir rascunho textual e metadados localmente
- enfileirar `upsert` no outbox
- resolver conflito 409 por sheet de conflito
- tratar mídia como caso separado

### Critério de aceite

- admin consegue editar rascunho textual offline
- ao voltar rede, rascunho sincroniza ou cai em conflito resolvível

---

## 8. UX mobile-first offline e aparência de app

## Princípio principal

**Offline invisível por padrão.**

### O que isso significa na prática

- nada de tela genérica gritando “sem internet” se o fluxo ainda é utilizável
- usar status contextual e discreto
- priorizar continuidade de tarefa
- mostrar pendência de sync só quando existir valor real para o usuário

## Regras de UX

### Shell

- o shell PWA deve continuar estável sem deslocamento visual
- topbar e bottom nav continuam visíveis
- safe areas continuam respeitadas

### Banner de rede

Revisar `OfflineBanner.tsx`.

#### Regra nova

- não exibir banner permanente em toda perda de rede
- exibir só em superfícies que realmente estão usando snapshot local e possam induzir erro de expectativa
- preferir texto discreto, curto, sem tom alarmista

### Pending bar

`PendingChangesBar` deve aparecer apenas quando houver alterações pendentes.

#### Regra nova

- sem linguagem técnica de “outbox”
- texto orientado a valor:
  - “Alterações salvas neste dispositivo”
  - “Vamos enviar quando a conexão voltar”

### Sync center

`SyncCenterSheet` deve ser o centro de status avançado.

#### Regra nova

- não mostrar automaticamente o tempo todo
- abrir via CTA na pending bar ou em erro de sync
- expor pendências, falhas e conflitos com clareza

### Locked screen

`OfflineLockedScreen` só deve ser usado quando realmente não houver sessão offline válida ou quando o fluxo for impossível offline.

#### Não usar como fallback preguiçoso.

---

## 9. Sessão offline e boot do app

## Decisão de segurança

### Usuário comum

- envelope offline permitido
- TTL de 7 dias pode ser mantido, mas o executor deve validar se é aceitável para o negócio

### Admin

- manter modo restrito
- TTL curto
- acesso offline admin limitado a leitura e rascunhos seguros
- telas financeiras/transacionais ao vivo ficam restritas/read-only

## Tarefa obrigatória

Integrar persistência e leitura do envelope offline nos pontos corretos:

- login do usuário
- login admin
- bootstrap da entrada PWA
- logout
- gate principal

## Critério de aceite

- login online atualiza envelope
- logout limpa envelope
- boot offline usa envelope válido
- envelope expirado derruba para fluxo correto sem corromper UX

---

## 10. IndexedDB, schema e migração

## FATO

O schema v1 já existe e é sólido para a primeira geração offline.

## Decisão

### Não quebrar a base atual sem necessidade.

### Ações

1. manter `OFFLINE_DB_VERSION = 1` se nenhuma store nova for necessária
2. subir para `2` apenas se precisar de store nova real
3. se adicionar store para blobs de mídia local, criar migration explícita

## Store nova possível

### Apenas se mídia admin offline for implementada de verdade

Adicionar algo como:

- `draft_assets`

Com campos mínimos:

- `assetId`
- `draftId`
- `kind`
- `blob`
- `mimeType`
- `createdAt`
- `syncState`
- `errorMessage`

### Regra

Não criar essa store se o agente optar por bloquear upload offline de mídia nesta fase.

## Critério de aceite

- sanity check passa
- upgrade não corrompe bases já existentes
- migração é idempotente e previsível

---

## 11. Cache de leitura offline

## Objetivo

Garantir leitura local consistente para as superfícies-chave.

## Decisão por fluxo

### Home / visão geral

Usar `profile_snapshots` como fonte de fallback.

### Receitas

Usar `recipe_snapshots` para:

- receitas desbloqueadas
- receitas já vistas/sincronizadas
- leitura de detalhes offline

### Busca

Criar `search-offline-repo.ts` para buscar em:

- `recipe_snapshots`
- eventualmente subconjunto de receitas públicas já sincronizadas

### Compras/desbloqueios

Consumir último snapshot sincronizado em `profile_snapshots`.

## Critério de aceite

- home não quebra sem rede se houver snapshot
- busca local funciona dentro do universo salvo no dispositivo
- recipe page abre com snapshot local quando disponível

---

## 12. Outbox, replay, retries e conflitos

## FATO

A base de outbox e replay já existe.

## Decisão

Completar o fechamento operacional da outbox.

### Regras

- replay é serial por entidade como já está
- replays devem continuar usando idempotência
- conflito 409 continua gerando `conflicts`
- falha previsível deve virar `failed` com retry controlado
- falha transitória deve voltar para `pending` com `nextRetryAt`

## O que falta fechar

- UX para resolução de conflitos
- exibição de falhas no Sync Center
- retry manual por usuário
- replay automático ao voltar rede e ao retomar foco

## Componente novo recomendado

- `ConflictResolutionSheet.tsx`

### Responsabilidades

- listar conflitos pendentes
- permitir escolha `local`, `server` ou `merge`
- explicar impacto de forma simples
- reativar sync após resolução

## Critério de aceite

- conflito não trava o app
- conflito fica visível no Sync Center
- usuário/admin consegue resolver e continuar

---

## 13. Service worker da fase offline

## Objetivo

Passar da fase online para offline real sem virar “cache cego”.

## Regra

O service worker da fase offline deve servir para:

- app shell
- assets estáticos
- páginas PWA críticas
- fallback básico de navegação instalada

## Não usar SW como banco de dados de negócio

Dados de negócio continuam em IndexedDB/repos offline-aware.

## Estratégia recomendada

### Precache

- shell principal
- manifest e ícones
- assets críticos

### Runtime caching controlado

- páginas PWA de navegação instaladas com estratégia segura
- assets públicos estáticos
- **não** usar o SW como fonte primária de favoritos/lista/snapshots

## Decisão importante

A lógica de negócio offline continua no app + IndexedDB, não no SW.

## Critério de aceite

- app instalado abre sem rede
- shell renderiza
- telas consomem snapshot local quando necessário

---

## 14. APIs e contratos necessários

## Decisão principal

**Não adicionar API nova por padrão nesta fase**, desde que os endpoints atuais realmente suportem o contrato já sugerido pelo código.

## Contratos que já aparecem no código e precisam ser validados

### Favoritos

- POST `/api/me/favorites`
- DELETE `/api/me/favorites?recipeId=...`
- header `X-Idempotency-Key`

### Lista de compras

- GET `/api/me/shopping-list`
- POST `/api/me/shopping-list`
- PUT `/api/me/shopping-list?id=...`
- DELETE `/api/me/shopping-list?id=...`
- header `X-Idempotency-Key`
- uso de `baseVersion` em update

### Receita admin

- `createRecipe(...)`
- `updateRecipe(...)`
- `baseServerUpdatedAt`
- conflito 409 tratado no replay

## [PENDENTE]

O executor deve validar no backend real:

- idempotência de fato
- semântica de 409 para conflito
- payload de retorno esperado
- atualização de `updatedAt`

## Se algo falhar

### Só então adicionar adaptação mínima de contrato

Nunca criar endpoint novo sem validar primeiro o que já existe.

---

## 15. Acessibilidade

Meta mínima: **WCAG 2.2 AA**.

## Exigir no offline

- feedback de sync com `role="status"` e `aria-live` quando necessário
- sheet de sync e conflito com foco correto
- labels reais em ações de retry/resolução
- não esconder estado crítico apenas em cor
- textos curtos e claros em mobile
- locked screen com CTA real e sem ambiguidade

## Critério de aceite

- banner/pending/sync center funcionam com leitor de tela
- sheet de conflito é navegável por teclado
- estados de sucesso/erro de sync são audíveis quando necessário

---

## 16. Performance

## Metas

- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1

## Regras específicas do offline

- abrir o app instalado em modo avião sem sensação de tela morta
- evitar hidratar payload gigante no boot
- snapshots devem ser usados de forma incremental
- busca local precisa ser eficiente
- não bloquear render aguardando sync

## Critério de aceite

- boot offline do shell acontece rápido
- páginas snapshot-first não ficam em loading eterno
- sync roda em segundo plano sem congelar UI

---

## 17. Backlog executável por ordem

## Etapa 1 — Fechar bootstrap offline

### Objetivo

Permitir abertura offline com sessão válida.

### Arquivos

- `src/pwa/app/shell/usePwaSessionGate.ts`
- `src/pwa/entry/PwaEntryPage.tsx`
- `src/pwa/entry/PwaAdminEntryPage.tsx`
- pontos de login/logout que persistem/limpam envelope

### O que fazer

- integrar `getOfflineUserSession()` e `getOfflineAdminSession()` ao gate
- persistir envelopes após login online bem-sucedido
- limpar envelope no logout

### Critério de aceite

- app abre offline após login prévio válido

---

## Etapa 2 — Montar Offline Runtime Provider

### Objetivo

Centralizar status, sync e UX offline.

### Arquivos

- criar `src/pwa/offline/runtime/OfflineRuntimeProvider.tsx`
- alterar `src/pwa/app/shell/UserPwaShell.tsx`

### O que fazer

- anexar sync on online
- anexar sync on resume
- rodar sanity check
- montar `SyncCenterSheet`
- expor pending count e conflitos para shell

### Critério de aceite

- sync automático e manual ficam centralizados

---

## Etapa 3 — Fechar UX offline invisível

### Objetivo

Fazer o app parecer app mesmo sem rede.

### Arquivos

- `OfflineBanner.tsx`
- `PendingChangesBar.tsx`
- `SyncCenterSheet.tsx`
- `OfflineLockedScreen.tsx`
- `UserPwaShell.tsx`

### O que fazer

- reduzir ruído binário online/offline
- manter status contextual
- mostrar pendência apenas quando existe
- mostrar conflito apenas quando existe
- usar locked screen só quando necessário

### Critério de aceite

- usuário continua tarefa sem sentir quebra de modo

---

## Etapa 4 — Fechar leitura offline do app do usuário

### Objetivo

Garantir leitura offline real.

### Arquivos

- `profile-offline-repo.ts`
- `recipes-offline-repo.ts`
- `search-offline-repo.ts`
- `UserHomePage.tsx`
- `PwaSearchPage.tsx`
- `PwaRecipePage.tsx`
- `PwaPurchasesPage.tsx`

### O que fazer

- home usar snapshot local quando necessário
- recipe page usar snapshot local
- search usar base local disponível
- purchases/unlocked usar snapshot

### Critério de aceite

- home, busca, compras e receita funcionam offline quando o dado já foi sincronizado

---

## Etapa 5 — Fechar mutações offline do usuário

### Objetivo

Garantir favoritos e lista de compras com replay seguro.

### Arquivos

- `favorites-offline-repo.ts`
- `shopping-offline-repo.ts`
- telas consumidoras

### O que fazer

- trocar chamadas diretas por offline-aware onde necessário
- garantir update otimista e replay
- mostrar pendência no shell

### Critério de aceite

- favoritos/lista funcionam offline e sincronizam depois

---

## Etapa 6 — Fechar admin offline seguro

### Objetivo

Permitir admin offline em escopo controlado.

### Arquivos

- `admin-recipes-offline-repo.ts`
- editor admin
- dashboard/admin pages PWA

### O que fazer

- snapshot read-only para telas seguras
- draft local para edição textual
- conflito resolvível
- bloquear ou tratar separadamente upload de mídia offline

### Critério de aceite

- admin consegue continuar rascunho textual offline com sync posterior

---

## Etapa 7 — Fechar conflito e retry

### Objetivo

Tornar conflito usável de verdade.

### Arquivos

- `useConflictCenter.ts`
- `SyncCenterSheet.tsx`
- `ConflictResolutionSheet.tsx`
- `sync-engine.ts`

### O que fazer

- exibir conflitos pendentes
- resolver manualmente
- re-disparar sync
- expor falhas claras

### Critério de aceite

- conflito não fica invisível nem sem saída

---

## Etapa 8 — Testes automáticos e manuais

### Objetivo

Validar modo avião real e replay.

### Arquivos

- criar suíte offline dedicada
- atualizar testes PWA existentes quando necessário

### Critério de aceite

- todas as provas do offline passam

---

## 18. Checklist de validação offline

## Automático

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`
- `npm run test:e2e -- --grep "offline|PWA"`

## Manual — Android Chrome

- instalar app
- logar online
- abrir tela home
- abrir receitas
- entrar em favoritos/lista
- ativar modo avião
- reabrir app instalado
- confirmar acesso offline com sessão válida
- favoritar/desfavoritar offline
- editar lista offline
- voltar rede
- confirmar replay

## Manual — iPhone Safari

- adicionar à tela inicial
- repetir fluxo de leitura offline
- validar safe areas
- validar sync ao retornar rede

## Manual — Desktop Chrome

- validar fallback instalado
- validar boot offline
- validar sync center

## Manual — Admin

- login admin online
- abrir rascunho
- desligar rede
- editar rascunho textual
- voltar rede
- sincronizar
- forçar conflito em ambiente de teste, se possível

## Validações obrigatórias de evidência

- screenshots de home offline
- screenshot de pending changes
- screenshot de sync center
- screenshot de conflito, se testado
- logs dos comandos

---

## 19. Definition of Done — Offline

A fase offline só está pronta quando:

- o app instalado abre offline com sessão válida
- o usuário autenticado previamente continua usando o app sem internet
- favoritos funcionam offline
- lista de compras funciona offline
- receitas já sincronizadas abrem offline
- busca local funciona sobre dados locais
- compras/desbloqueios aparecem via snapshot
- sync automático roda ao voltar rede e ao retomar foco
- pending changes aparecem de forma discreta e útil
- conflitos são tratáveis na UI
- admin tem escopo offline seguro e previsível
- o usuário não precisa pensar em “modo offline” para continuar usando o app
- validações automáticas e manuais passam

---

## 20. Handoff final para o Agente Executor

Execute no imperativo, sem interpretar.

- Trabalhe direto na `main`.
- Não crie branch.
- Não altere o CTA `Instalar aplicativo`.
- Reaproveite `src/pwa/offline/*` antes de criar qualquer nova abstração.
- Integre a sessão offline ao `usePwaSessionGate.ts`.
- Monte um `OfflineRuntimeProvider` no shell PWA.
- Conecte `attachSyncOnOnline()` e `attachSyncOnResume()` ao runtime principal.
- Faça a UI offline ser invisível por padrão e contextual quando necessário.
- Faça home, receitas, busca, favoritos, lista de compras e compras funcionarem offline sobre snapshots/repos locais.
- Garanta replay automático e manual.
- Garanta resolução de conflito.
- Feche admin offline em escopo seguro, sem prometer o que não pode sincronizar.
- Se mídia offline admin não for segura agora, bloqueie com UX de app e documente explicitamente.
- Não invente endpoint novo sem provar que o atual não serve.
- Rode todos os comandos.
- Valide modo avião em Android, iPhone e desktop.
- Colete evidências.
- Só encerre quando todos os critérios da Definition of Done forem satisfeitos.

## 21. Encerramento

Este arquivo é o dossiê completo para o agente executar a fase OFFLINE do PWA sem pensar, sem inventar contrato e sem quebrar o que já funciona no online.
