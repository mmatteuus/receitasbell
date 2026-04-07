# DCI detalhado por etapa - PWA Online

## Formato deste DCI
Cada etapa define:
- objetivo
- arquivos
- como fazer
- comandos
- dependencia
- criterio de aceite
- evidencia esperada
- risco comum
- correcao esperada

## Etapa 01 - Corrigir CTA de instalacao
### Objetivo
Padronizar naming e governanca sem alterar o mecanismo base de instalacao.

### Arquivos
- `src/pwa/components/InstallAppButton.tsx`
- `src/pwa/entry/PwaEntryPage.tsx`
- `src/pwa/pages/UserLoginPage.tsx`

### Como fazer
- trocar todo texto `Instalar App` por `Instalar aplicativo`
- manter a logica atual de `beforeinstallprompt`
- manter retorno `null` quando instalado
- nao inventar outro hook
- nao alterar contrato de `InstallContext`

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`

### Dependencia
- nenhuma dependencia nova

### Criterio de aceite
- o texto antigo nao existe mais no namespace PWA
- o componente continua compilando sem mudar sua API

### Evidencia esperada
- diff do componente
- captura do CTA correto

### Risco comum
- alterar a API do componente e quebrar usos existentes

### Correcao esperada
- manter props e assinatura atuais

## Etapa 02 - Remover CTA dos contextos proibidos
### Objetivo
Eliminar vazamento da instalacao para web tradicional e admin web, preservando o placement explicito no header ao lado do carrinho.

### Arquivos
- `src/pages/AccountHome.tsx`
- `src/components/layout/AdminLayout.tsx`

### Como fazer
- remover import de `InstallAppButton` onde existir
- remover card, bloco, botao ou atalho de instalacao desses arquivos
- nao tocar no placement explicito do header solicitado pelo usuario

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`

### Dependencia
- nenhuma

### Criterio de aceite
- `AccountHome` e `AdminLayout` nao referenciam mais `InstallAppButton`

### Evidencia esperada
- diff e capturas sem CTA nesses contextos

### Risco comum
- remover CTA tambem do header sem querer

### Correcao esperada
- limitar a limpeza aos contextos proibidos ainda vigentes

## Etapa 03 - Limpar a shell PWA da fase online
### Objetivo
Preservar experiencia de app online sem prometer offline pronto.

### Arquivos
- `src/pwa/app/shell/UserPwaShell.tsx`

### Como fazer
- remover ou neutralizar sinais de offline real
- preservar `PwaUpdateBanner`
- preservar `PwaTopBar`
- preservar `PwaBottomNav`
- preservar redirect de auth e safe-area

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`

### Dependencia
- nenhuma dependencia nova

### Criterio de aceite
- a shell nao mostra mensagens de offline pronto

### Evidencia esperada
- captura da shell limpa

### Risco comum
- quebrar o fluxo de auth

### Correcao esperada
- mexer apenas nos blocos de offline

## Etapa 04 - Padronizar a UI mobile do namespace PWA
### Objetivo
Criar consistencia de dimensao, alinhamento e sensacao de app.

### Arquivos
- componentes PWA que renderizam campos, botoes, listas e blocos principais

### Como fazer
- aplicar minimo `48px` em campos e botoes
- aplicar minimo `56px` em itens tocaveis
- usar truncamento ou clamp em textos longos
- eliminar overflow horizontal

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`

### Dependencia
- usar componentes existentes antes de criar novos

### Criterio de aceite
- nenhum botao irmao com altura diferente na mesma linha

### Evidencia esperada
- capturas em 360, 390 e 430 px

### Risco comum
- gerar inconsistencia entre telas

### Correcao esperada
- consolidar classes base reutilizaveis quando necessario

## Etapa 05 - Reescrever `PwaSearchPage`
### Objetivo
Parar de espelhar a tela web.

### Arquivos
- `src/pwa/pages/PwaSearchPage.tsx`

### Como fazer
- remover import de `@/pages/Search`
- montar tela propria mobile-first com campo de busca, resultados, loading, vazio e erro
- manter navegacao em `/pwa/**`

### Comandos
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Dependencia
- reaproveitar hooks e dados existentes

### Criterio de aceite
- `PwaSearchPage` nao importa mais a tela web

### Evidencia esperada
- diff e captura da busca em mobile

## Etapa 06 - Reescrever `PwaRecipePage`
### Objetivo
Parar de espelhar a tela web de receita.

### Arquivos
- `src/pwa/pages/PwaRecipePage.tsx`

### Como fazer
- remover import de `@/pages/RecipePage`
- montar tela propria com imagem, titulo, metadados, acoes alinhadas e leitura confortavel

### Comandos
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Dependencia
- reaproveitar dados e apresentacao existentes

### Criterio de aceite
- `PwaRecipePage` nao importa mais a tela web

### Evidencia esperada
- diff e captura da receita em mobile

## Etapa 07 - Refinar top bar, bottom nav e entry page
### Objetivo
Fechar a sensacao de aplicativo instalado.

### Arquivos
- `src/pwa/app/navigation/PwaTopBar.tsx`
- `src/pwa/app/navigation/PwaBottomNav.tsx`
- `src/pwa/entry/PwaEntryPage.tsx`

### Como fazer
- reduzir cara de site
- revisar safe-area
- revisar targets de toque
- revisar densidade visual
- revisar espacos mortos

### Comandos
- `npm run lint`
- `npm run typecheck`

### Criterio de aceite
- navegacao parece de app

## Etapa 08 - Validar manifesto e update flow
### Objetivo
Garantir instalabilidade sem mexer no que ja esta correto.

### Arquivos
- `vite.config.ts`
- assets de icone, se necessario

### Como fazer
- preservar `display: standalone`
- preservar `start_url: /pwa/entry`
- preservar `scope: /pwa/`
- nao ampliar para offline real

### Comandos
- `npm run build`

### Criterio de aceite
- instalacao continua funcionando

## Etapa 09 - Ampliar testes
### Objetivo
Cobrir a nova governanca PWA.

### Arquivos
- `tests/pwa.spec.ts`

### Como fazer
- validar `Instalar aplicativo`
- validar ausencia de `Instalar App`
- validar ausencia do CTA em `AccountHome` e `AdminLayout`
- validar os 3 fluxos criticos
- validar viewports 360, 390 e 430

### Comandos
- `npm run test:e2e`

### Criterio de aceite
- suite verde
