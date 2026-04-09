# PRD PWA Online — Receitas Bell

## 1. Snapshot do Projeto

### Stack confirmada no repositório

**FATO**

- Framework de UI: React 18.
- Bundler: Vite 6.
- Linguagem: TypeScript.
- Roteamento: `react-router-dom` com `createBrowserRouter`.
- Estilo: Tailwind CSS.
- UI primitives: Radix UI.
- Estado remoto: TanStack React Query.
- Observabilidade: Sentry + telemetria interna.
- Testes: Vitest + Playwright.
- PWA: `vite-plugin-pwa`.
- Package manager inferido: npm.

### Arquivos-base auditados

**FATO**

- `README.md`
- `package.json`
- `vite.config.ts`
- `index.html`
- `src/router.tsx`
- `src/pwa/app/shell/UserPwaShell.tsx`
- `src/pwa/app/navigation/PwaTopBar.tsx`
- `src/pwa/app/navigation/PwaBottomNav.tsx`
- `src/pwa/entry/PwaEntryPage.tsx`
- `src/pwa/pages/UserLoginPage.tsx`
- `src/components/layout/InstallAppButton.tsx`
- `src/pwa/components/InstallAppButton.tsx`
- `src/pwa/components/PwaUpdateBanner.tsx`
- `src/pwa/components/PwaInstallHintIOS.tsx`
- `src/pwa/hooks/useInstallPrompt.ts`
- `src/hooks/use-pwa-install.ts`
- `tests/pwa.spec.ts`

## 2. FATO / SUPOSIÇÃO / [PENDENTE]

### FATO

- O projeto já possui **base PWA real** com manifest e service worker via `vite-plugin-pwa`.
- O projeto já possui **namespace PWA dedicado** em `/pwa/*`.
- Existe shell mobile com top bar fixa, bottom nav fixa e uso de `safe-area` no shell.
- Já existe fluxo de update com `useRegisterSW` e banner de atualização.
- Já existem testes Playwright específicos para PWA e responsividade.
- O app é **multi-tenant**, com caminhos `/t/:tenantSlug/...`.
- O `start_url` atual do manifest está fixado em `/pwa/login`.
- O service worker atual faz `runtimeCaching` para `https://api.*` com `NetworkFirst`.
- Existem **duas implementações** de botão/hook de instalação, em superfícies diferentes.

### SUPOSIÇÃO

- A fase online desejada precisa manter a experiência atual funcionando e reduzir risco de regressão, sem refatoração grande de auth.
- O executor terá acesso de escrita ao código-fonte local e poderá rodar `npm run lint`, `npm run typecheck`, `npm run test:unit` e `npm run test:e2e`.
- A superfície instalada precisa abrir o app por um bootstrap estável, sem depender de login fixo ou tenant hardcoded.

### [PENDENTE]

- Validar em dispositivo real Android se o fluxo de instalação atual exibe prompt nativo em todos os pontos planejados.
- Validar em iPhone real se o hint de instalação cobre Safari sem poluir telas de login e home.
- Validar Lighthouse mobile após os ajustes online.

## 3. Diagnóstico Atual

### Status por eixo

| Eixo | Status | Leitura objetiva |
|---|---|---|
| UX mobile-first | PARCIAL | boa base no shell PWA, mas HTML global e CTA ainda desalinhados |
| Responsividade real | PARCIAL | há testes e shell com `max-w-md`, mas falta endurecer metas mobile globais |
| Semântica e acessibilidade | PARCIAL | boa base de componentes, mas ainda existem pontos de CTA e instrução não padronizados |
| Performance online | PARCIAL | build com chunks manuais e update flow existente, mas SW cacheia API |
| Instalabilidade PWA | PARCIAL | manifest existe, porém `start_url` atual é frágil para multi-tenant |
| Aparência de app | PARCIAL | shell PWA é app-like, mas `index.html` ainda está com cara de site |
| Feedback de sistema | OK | update banner e toasts existem |
| Loading / empty / error | PARCIAL | login e entry têm loading, mas falta padronização global de superfícies PWA |
| Navegação e retorno | OK | top bar/back/bottom nav já existem |
| Observabilidade frontend | PARCIAL | telemetria existe, mas não é o foco desta fase |
| Segurança básica frontend | OK | auth e isolamento de namespace já existem |
| Qualidade visual mobile | PARCIAL | base boa, porém metas PWA e CTA ainda estão inconsistentes |

### Problemas atuais mais importantes

1. **Manifest com `start_url` fixo em `/pwa/login`**
   - risco de abrir o app instalado em ponto errado
   - risco maior em multi-tenant
   - existe `/pwa/entry`, que é bootstrap mais adequado

2. **Service worker online cacheando API**
   - risco de dado velho
   - risco de sessão/auth inconsistente
   - risco de comportamento diferente entre tenant e usuário

3. **CTA de instalação inconsistente**
   - regra do projeto exige exatamente `Instalar aplicativo`
   - existe componente PWA correto e componente legacy divergente

4. **`index.html` ainda sem preparo mobile-first completo para app instalado**
   - falta `viewport-fit=cover`
   - faltam metas iOS de web app
   - `theme-color` do HTML não está alinhado ao manifest

5. **Hint iOS promete coisas fora do escopo online**
   - menciona offline e notificações
   - isso não deve aparecer antes da fase offline aprovada

## 4. Objetivo do PWA Online

Entregar uma PWA **instalável, mobile-first, com aparência real de app**, sem introduzir offline funcional.

### Resultado esperado

- abertura consistente do app instalado
- instalação clara em Android e iOS
- shell mobile confiável
- zero promessa falsa de offline
- service worker limitado a melhoria de assets estáticos e update flow
- experiência com cara de app, não de site aberto no navegador

## 5. Arquitetura `/pwa`

### Regra operacional desta pasta

Como o usuário determinou **nenhuma subpasta nova** em `IMPLANTAR/PWA`, este dossiê fica concentrado em arquivos `.md` diretos na pasta:

- `IMPLANTAR/PWA/00-INDICE-DOSSIE-PWA-ONLINE.md`
- `IMPLANTAR/PWA/01-PRD-PWA-ONLINE.md`
- `IMPLANTAR/PWA/02-TAREFAS-EXECUTAVEIS-PWA-ONLINE.md`
- `IMPLANTAR/PWA/03-PATCHES-PENDENTES-PWA-ONLINE.md`
- `IMPLANTAR/PWA/04-CHECKLIST-VALIDACAO-PWA-ONLINE.md`
- `IMPLANTAR/PWA/05-NAO-FAZER-NESTA-FASE-ONLINE.md`
- `IMPLANTAR/PWA/06-RESUMO-PARA-O-AGENTE-EXECUTOR.md`

### Arquitetura funcional do app online

**Manter**

- `src/pwa/*` como namespace de superfícies app-like
- `src/pwa/app/shell/UserPwaShell.tsx` como shell mobile principal
- `src/pwa/entry/PwaEntryPage.tsx` como bootstrap de entrada
- `src/pwa/components/PwaUpdateBanner.tsx` para update flow

**Ajustar**

- `index.html` para metas mobile/iOS
- `vite.config.ts` para endurecer manifest e SW da fase online
- CTAs de instalação para padronização exata
- copy iOS para não prometer offline

## 6. Arquivos que serão criados/alterados

### Arquivos criados nesta entrega

- `IMPLANTAR/PWA/00-INDICE-DOSSIE-PWA-ONLINE.md`
- `IMPLANTAR/PWA/01-PRD-PWA-ONLINE.md`
- `IMPLANTAR/PWA/02-TAREFAS-EXECUTAVEIS-PWA-ONLINE.md`
- `IMPLANTAR/PWA/03-PATCHES-PENDENTES-PWA-ONLINE.md`
- `IMPLANTAR/PWA/04-CHECKLIST-VALIDACAO-PWA-ONLINE.md`
- `IMPLANTAR/PWA/05-NAO-FAZER-NESTA-FASE-ONLINE.md`
- `IMPLANTAR/PWA/06-RESUMO-PARA-O-AGENTE-EXECUTOR.md`

### Arquivos existentes que precisam ser alterados pelo executor

- `index.html`
- `vite.config.ts`
- `src/components/layout/InstallAppButton.tsx`
- `src/pwa/components/PwaInstallHintIOS.tsx`

### Arquivos existentes que devem ser preservados sem refatoração grande nesta fase

- `src/pwa/entry/PwaEntryPage.tsx`
- `src/pwa/app/shell/UserPwaShell.tsx`
- `src/pwa/app/navigation/PwaTopBar.tsx`
- `src/pwa/app/navigation/PwaBottomNav.tsx`
- `src/pwa/components/PwaUpdateBanner.tsx`
- `src/pwa/pages/UserLoginPage.tsx`
- `tests/pwa.spec.ts`

## 7. Rotas, navegação e fluxos críticos

### Rotas PWA confirmadas

- `/pwa/entry`
- `/pwa/login`
- `/pwa/auth/verify`
- `/pwa/auth/update-password`
- `/pwa/admin/entry`
- `/pwa/app`
- `/pwa/app/favoritos`
- `/pwa/app/lista-de-compras`
- `/pwa/app/compras`
- `/pwa/app/buscar`
- `/pwa/app/receitas/:slug`
- `/pwa/admin/*`
- `/pwa/*` fallback

### 3 fluxos mais críticos

#### Fluxo 1 — Instalação e abertura do app

1. usuário acessa superfície PWA
2. CTA `Instalar aplicativo` aparece quando suportado
3. app instalado abre por `/pwa/entry`
4. bootstrap resolve login / redirect / tenant

#### Fluxo 2 — Login PWA do usuário

1. usuário cai em `/pwa/login`
2. autentica por senha ou Google
3. redirect vai para `/pwa/app` ou rota pendente
4. shell app-like mantém top bar e bottom nav

#### Fluxo 3 — Atualização da PWA

1. nova versão é publicada
2. SW detecta atualização
3. `PwaUpdateBanner` mostra CTA de atualização
4. usuário atualiza e entra na versão nova

## 8. UX mobile-first e aparência de app

### Critérios obrigatórios desta fase

- abrir como app com chrome mínimo
- respeitar safe areas
- manter toque confortável
- impedir experiência de site aberta no browser
- CTA de instalação explícito e consistente
- sem dependência de hover na superfície PWA

### Decisões

1. **Usar `/pwa/entry` como ponto de entrada instalado**
   - evita acoplamento indevido com login puro
   - aproveita bootstrap existente

2. **Padronizar todo CTA de instalação em `Instalar aplicativo`**
   - sem variações
   - sem `Instalar`, `Instalar app` ou equivalentes

3. **Remover promessa de offline e notificações do hint iOS**
   - a fase online não entrega isso

4. **Atualizar metas mobile do HTML global**
   - `viewport-fit=cover`
   - metas iOS app-like
   - `theme-color` coerente

## 9. Manifest, instalação e update flow

### Manifest — decisão online

**Alterar em `vite.config.ts`**

- `start_url`: de `/pwa/login` para `/pwa/entry`
- `display`: manter `standalone`
- `scope`: manter `/`
- `orientation`: manter `portrait-primary`
- `theme_color`: manter alinhada ao laranja da marca
- `background_color`: manter neutra e clara

### Instalação — decisão online

- Android/Chrome: usar `beforeinstallprompt`
- iOS/Safari: instrução manual via hint, sem prometer offline
- CTA oficial: **`Instalar aplicativo`**

### Update flow — decisão online

- manter `registerType: 'autoUpdate'`
- manter `PwaUpdateBanner`
- não ampliar escopo de cache de dados de negócio

## 10. Service worker da fase online

### Regra obrigatória

Nesta fase o SW serve para:

- assets estáticos
- app shell
- atualização controlada
- limpeza de caches antigos

### Proibição explícita

Nesta fase o SW **não deve**:

- cachear API de negócio
- manter dados de autenticação offline
- vender sensação de offline pronto

### Mudança obrigatória

Remover o `runtimeCaching` atual de `https://api.*` no `vite.config.ts`.

## 11. Acessibilidade

### Exigir nesta fase

- CTA com texto explícito
- `aria-label` coerente com CTA
- instruções iOS legíveis
- sem texto enganoso
- sem ícones sem contexto em ação primária

### Meta mínima

- manter base compatível com WCAG 2.2 AA

## 12. Performance

### Metas de referência

- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1

### Ações online desta fase

- não cachear API via SW
- manter chunks manuais existentes
- manter update flow enxuto
- validar mobile com Lighthouse após mudanças

## 13. APIs e contratos necessários

### Decisão

**Não é necessário adicionar API nova** para a fase online.

### Motivo

Os ajustes necessários são de:

- manifest
- HTML base
- service worker
- CTA de instalação
- copy e experiência de instalação

## 14. Backlog executável por ordem

### Ordem curta

1. aplicar patch em `index.html`
2. aplicar patch em `vite.config.ts`
3. aplicar patch em `src/components/layout/InstallAppButton.tsx`
4. aplicar patch em `src/pwa/components/PwaInstallHintIOS.tsx`
5. rodar lint, typecheck, unit e build
6. rodar Playwright focado em PWA
7. validar manualmente Android/iOS/desktop

## 15. Checklist de validação

Usar o arquivo:

- `04-CHECKLIST-VALIDACAO-PWA-ONLINE.md`

## 16. Definition of Done — Online

A fase online só estará pronta quando:

- o app instalar com CTA `Instalar aplicativo`
- o app instalado abrir por `/pwa/entry`
- o service worker não cachear API de negócio
- o HTML base estiver ajustado para app mobile
- o hint iOS não prometer offline
- build, lint, typecheck e testes PWA passarem
- a navegação atual continuar funcionando

## 17. Handoff final para o Agente Executor

- Trabalhe direto na `main`.
- Não crie branch.
- Não crie pasta nova dentro de `IMPLANTAR/PWA`.
- Leia este PRD inteiro antes de tocar no código.
- Aplique primeiro os patches de `03-PATCHES-PENDENTES-PWA-ONLINE.md`.
- Não mexa em offline, IndexedDB, sync, outbox, cache de dados ou modo avião.
- Preserve as rotas e fluxos que já funcionam.
- Rode validação técnica e manual antes de encerrar.
- Só considere concluído quando todos os critérios do checklist forem atendidos.

## 18. Encerramento pedindo: `APROVADO ONLINE`

**Responda APROVADO ONLINE para eu gerar o PRD PWA OFFLINE.**
