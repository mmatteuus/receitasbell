# 1. Snapshot do Projeto

- Projeto: `receitas-bell`
- Runtime: Node `20.x`
- Stack principal: React 18 + TypeScript + Vite 6 + React Router 6 + Tailwind CSS
- UI base: Radix UI + componentes internos
- Testes: Vitest + Playwright
- PWA: `vite-plugin-pwa`
- Manifest atual:
  - `display: standalone`
  - `start_url: /pwa/entry`
  - `scope: /pwa/`
- Namespace PWA existente:
  - `/pwa/entry`
  - `/pwa/login`
  - `/pwa/auth/verify`
  - `/pwa/auth/update-password`
  - `/pwa/admin/login`
  - `/pwa/app/*`
  - `/pwa/admin/*`

# 2. FATO / SUPOSICAO / [PENDENTE]

## FATO
- O projeto ja possui configuracao PWA no `vite.config.ts`.
- O manifesto ja esta definido com `display: standalone`, `start_url: /pwa/entry` e `scope: /pwa/`.
- Existe `InstallAppButton`.
- O CTA atual esta com texto incorreto: `Instalar App`.
- O botao de instalacao aparece em contextos errados: conta/perfil web e admin web.
- `PwaSearchPage` importa a tela web de busca.
- `PwaRecipePage` importa a tela web de receita.
- Existe shell PWA com top bar e bottom nav.
- A shell PWA atual mistura componentes ligados a camada offline.
- Existem testes Playwright basicos para namespace PWA.

## SUPOSICAO
- O problema relatado sobre o PWA aparecer em perfis se refere ao vazamento do CTA e do comportamento PWA em contextos errados.
- O foco principal desta fase e a experiencia do usuario final em mobile.
- O admin nao e a principal superficie de instalacao nesta fase.
- O executor deve reusar a stack atual e evitar dependencia nova sem necessidade real.

## [PENDENTE]
- Confirmar no futuro se o admin deve ter experiencia instalada propria ou apenas namespace navegavel.
- Confirmar se existe guideline visual externa ao repositorio.
- Confirmar se havera branding por tenant no manifesto.

# 3. Diagnostico Atual

| Item | Status | Diagnostico objetivo |
|---|---|---|
| UX mobile-first | PARCIAL | Existe namespace PWA, mas telas criticas ainda espelham a web. |
| Responsividade real | PARCIAL | Ha responsividade geral, mas sem contrato rigido de medidas e alinhamento. |
| Semantica e acessibilidade | PARCIAL | Base boa, mas sem contrato fechado para PWA mobile. |
| Performance online | PARCIAL | Ha chunking e SW, mas parte do PWA ainda carrega telas web inteiras. |
| Instalabilidade PWA | PARCIAL | Manifest e install flow existem, mas placement e naming estao errados. |
| Aparencia de app | PARCIAL | Ha shell e navegacao, porem ainda existe cara de site. |
| Feedback de sistema | PARCIAL | Ha banners e feedbacks, mas shell mistura sinais da fase offline. |
| Estados loading/empty/error | PARCIAL | Existem em partes do produto, nao padronizados para PWA. |
| Navegacao e retorno | PARCIAL | Estrutura existe, mas ownership do namespace PWA ainda nao esta blindado. |
| Observabilidade frontend | PARCIAL | Ha telemetria, mas precisa ser preservada e amarrada aos fluxos PWA. |
| Seguranca basica frontend | PARCIAL | Ha guards, mas e preciso evitar fuga para namespace web. |
| Qualidade visual mobile | AUSENTE | Nao existe contrato unico para altura, truncamento e alinhamento. |

# 4. Objetivo do PWA Online

Entregar uma experiencia PWA mobile-first com aparencia de aplicativo instalado, sem depender de hover, com toque confortavel, safe-area correta, navegacao propria, instalacao clara e sem prometer funcionamento offline real.

Objetivos concretos:
- o usuario nao deve sentir site dentro do navegador;
- o CTA de instalacao deve existir so nos pontos corretos;
- o texto deve ser exatamente `Instalar aplicativo`;
- campos e botoes devem ter medidas padronizadas;
- busca e receita PWA devem ser telas proprias;
- a shell PWA deve parecer app;
- esta fase nao deve vender nem simular offline pronto.

# 5. Arquitetura do dossie em `IMPLANTAR/pwa`

Arquivos obrigatorios deste dossie:
- `README.md`
- `01-PRD-PWA-ONLINE.md`
- `02-ORDEM-DE-EXECUCAO.md`
- `03-ARQUIVO-POR-ARQUIVO.md`
- `04-PADRAO-UI-MOBILE.md`
- `05-CONTRATOS-E-REGRAS.md`
- `06-FLUXO-DE-INSTALACAO.md`
- `07-PLANO-DE-TESTES.md`
- `08-CHECKLIST-DE-VALIDACAO.md`
- `09-HANDOFF-EXECUTOR.md`

# 6. Arquivos que serao criados/alterados

## Criados no repositorio
- `IMPLANTAR/pwa/*`

## Alterar no app
- `src/pwa/components/InstallAppButton.tsx`
- `src/pwa/entry/PwaEntryPage.tsx`
- `src/pwa/pages/UserLoginPage.tsx`
- `src/pwa/pages/AdminLoginPage.tsx`
- `src/pwa/app/shell/UserPwaShell.tsx`
- `src/pwa/app/navigation/PwaTopBar.tsx`
- `src/pwa/app/navigation/PwaBottomNav.tsx`
- `src/pwa/pages/PwaSearchPage.tsx`
- `src/pwa/pages/PwaRecipePage.tsx`
- `src/pages/AccountHome.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/Header.tsx`
- `tests/pwa.spec.ts`
- `vite.config.ts` somente se necessario para manifesto ou icones

# 7. Rotas, navegacao e fluxos criticos

## Rotas relevantes
- `/pwa/entry`
- `/pwa/login`
- `/pwa/auth/verify`
- `/pwa/auth/update-password`
- `/pwa/admin/login`
- `/pwa/app`
- `/pwa/app/favoritos`
- `/pwa/app/lista-de-compras`
- `/pwa/app/compras`
- `/pwa/app/buscar`
- `/pwa/app/receitas/:slug`
- `/pwa/admin/**`

## 3 fluxos criticos

### Fluxo 1 - instalacao
1. Usuario entra em `/pwa/entry`
2. Entende que esta entrando no app
3. Ve o CTA `Instalar aplicativo`
4. Instala no Android quando houver suporte
5. Em iOS, recebe instrucao manual clara
6. Prossegue para login e shell PWA

### Fluxo 2 - autenticacao
1. Usuario entra em `/pwa/login`
2. Faz login
3. O redirect salvo e respeitado
4. Entra em `/pwa/app`
5. Permanece no namespace PWA

### Fluxo 3 - descoberta e consumo
1. Usuario abre `/pwa/app/buscar`
2. Busca com UI de app
3. Abre `/pwa/app/receitas/:slug`
4. Consome a receita sem chrome web
5. Volta por navegacao PWA

# 8. UX mobile-first e aparencia de app

## Regras fixas de UI

### Dimensoes
- campos: altura minima `48px`
- botoes primarios e secundarios: altura minima `48px`
- botoes apenas com icone: altura minima `48px`
- itens tocaveis de lista: altura minima `56px`
- cards de acao: padding interno minimo `16px`

### Padronizacao
- botoes irmaos devem ter mesma altura
- campos irmaos devem ter mesma altura
- icones nao podem alterar a altura visual
- textos longos nao podem estourar o layout
- rotulos de botao devem ficar em uma linha
- usar truncamento ou clamp quando necessario

### Layout mobile
- coluna unica como padrao no PWA
- zero overflow horizontal
- safe-area no topo e no rodape
- sem hero de landing page no app autenticado
- sem densidade de desktop disfarcada de mobile

### Aparencia de app
- top bar compacta e fixa
- bottom nav compacta e fixa
- conteudo com densidade de aplicativo
- espacos consistentes
- acoes prioritarias muito claras

# 9. Manifest, instalacao e update flow

## Manifest
Manter:
- `display: standalone`
- `start_url: /pwa/entry`
- `scope: /pwa/`

## CTA de instalacao
Texto unico permitido:
`Instalar aplicativo`

## Pontos permitidos
- `/pwa/entry`
- `/pwa/login`
- futura area de ajuda ou configuracoes PWA, se existir

## Pontos proibidos
- header web global
- perfil web
- minha conta web
- admin layout web
- cards genericos fora de `/pwa/**`

## Update flow
- manter `autoUpdate`
- manter banner de atualizacao
- o update deve ser explicito para o usuario quando necessario
- nao recarregar silenciosamente no meio de acao critica

# 10. Service worker da fase online

Permitido nesta fase:
- cache de assets estaticos
- melhoria de performance da shell
- limpeza de caches antigos
- atualizacao controlada

Proibido nesta fase:
- cache de dados de negocio para offline real
- fila offline
- sync offline
- resolucao de conflito
- IndexedDB funcional como requisito de produto
- promessa de uso em modo aviao

# 11. Acessibilidade

Meta minima: WCAG 2.2 AA

Obrigatorio:
- HTML semantico
- labels reais
- foco visivel
- ordem logica de tab
- mensagens de erro ligadas ao campo
- ajuda ligada ao campo
- contraste adequado
- safe-area respeitada
- sem dependencia de hover
- `prefers-reduced-motion` quando houver animacao

# 12. Performance

Metas:
- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1

Obrigatorio:
- evitar importar tela web inteira no PWA
- lazy loading quando fizer sentido
- reservar espaco para imagens
- evitar re-render desnecessario
- medir em viewport mobile
- evitar piorar chunk splitting existente

# 13. APIs e contratos necessarios

Nao e necessario adicionar API nova para a fase PWA ONLINE.

Contratos necessarios:
- ownership de rotas `/pwa/**`
- placement do CTA `Instalar aplicativo`
- contrato de dimensoes minimas de UI
- contrato de update banner
- contrato de truncamento e contencao de texto

# 14. Backlog executavel por ordem

1. Corrigir o CTA de instalacao
2. Remover o CTA dos contextos errados
3. Isolar a shell PWA da camada offline nesta fase
4. Padronizar UI mobile do namespace PWA
5. Reescrever `PwaSearchPage`
6. Reescrever `PwaRecipePage`
7. Refinar top bar, bottom nav e safe-area
8. Validar manifesto, icones e fluxo de update
9. Ampliar testes moveis e de instalacao
10. Validar Definition of Done online

# 15. Checklist de validacao

Usar o arquivo `08-CHECKLIST-DE-VALIDACAO.md`.

# 16. Definition of Done - Online

A fase online so estara pronta quando:
- o CTA estiver exatamente como `Instalar aplicativo`
- o CTA existir apenas nos pontos PWA definidos
- `AccountHome`, `Header` web e `AdminLayout` web nao mostrarem instalacao
- `PwaSearchPage` nao importar mais a tela web
- `PwaRecipePage` nao importar mais a tela web
- a shell PWA nao comunicar offline pronto
- top bar e bottom nav respeitarem safe-area
- campos e botoes estiverem padronizados
- os 3 fluxos criticos passarem em mobile

# 17. Handoff final para o Agente Executor

- Siga a ordem exata de `02-ORDEM-DE-EXECUCAO.md`.
- Siga o detalhamento de `03-ARQUIVO-POR-ARQUIVO.md`.
- Aplique o contrato visual de `04-PADRAO-UI-MOBILE.md`.
- Respeite os contratos de `05-CONTRATOS-E-REGRAS.md`.
- Valide instalacao pelo fluxo de `06-FLUXO-DE-INSTALACAO.md`.
- Execute os testes de `07-PLANO-DE-TESTES.md`.
- Feche o aceite com `08-CHECKLIST-DE-VALIDACAO.md`.

# 18. Encerramento pedindo: `APROVADO ONLINE`

**Responda APROVADO ONLINE para eu gerar o PRD PWA OFFLINE.**
