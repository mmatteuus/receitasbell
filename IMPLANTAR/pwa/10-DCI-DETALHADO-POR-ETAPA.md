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
Eliminar vazamento da instalacao para web tradicional e admin web.

### Arquivos
- `src/pages/AccountHome.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/Header.tsx`

### Como fazer
- remover import de `InstallAppButton` onde existir
- remover card, bloco, botao ou atalho de instalacao desses arquivos
- nao remover navegacao legitima que nao tenha relacao com instalacao

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`

### Dependencia
- nenhuma

### Criterio de aceite
- nenhum desses arquivos referencia `InstallAppButton`
- nenhuma tela web tradicional oferece instalacao

### Evidencia esperada
- busca textual no diff
- captura de tela da conta web, header web e admin web sem CTA

### Risco comum
- apagar bloco errado do menu mobile do Header

### Correcao esperada
- remover apenas o trecho de instalacao, mantendo os demais itens do menu

## Etapa 03 - Limpar a shell PWA da fase online
### Objetivo
Preservar experiencia de app online sem prometer offline pronto.

### Arquivos
- `src/pwa/app/shell/UserPwaShell.tsx`
- componentes imediatamente ligados a sinais offline, se precisarem ser neutralizados

### Como fazer
- remover ou neutralizar `OfflineLockedScreen`
- remover ou neutralizar `OfflineBanner`
- remover ou neutralizar `PendingChangesBar`
- remover ou neutralizar `SyncCenterSheet`
- remover ou neutralizar `ConflictResolutionDialog`
- preservar `PwaUpdateBanner`
- preservar `PwaTopBar`
- preservar `PwaBottomNav`
- preservar redirect de auth
- preservar safe-area

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`

### Dependencia
- nenhuma dependencia nova

### Criterio de aceite
- a shell nao mostra mensagens de offline pronto
- o usuario continua navegando no app normalmente

### Evidencia esperada
- captura da shell limpa
- diff do arquivo

### Risco comum
- quebrar o fluxo de auth ao remover trechos demais

### Correcao esperada
- mexer apenas nos blocos de offline e manter gate e redirect

## Etapa 04 - Padronizar a UI mobile do namespace PWA
### Objetivo
Criar consistencia de dimensao e alinhamento.

### Arquivos
- componentes PWA que renderizam campos, botoes, listas e blocos principais

### Como fazer
- aplicar minimo `48px` em campos e botoes
- aplicar minimo `56px` em itens tocaveis de lista
- aplicar truncamento ou clamp em textos longos
- garantir alinhamento consistente entre botoes irmaos
- eliminar overflow horizontal

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`

### Dependencia
- usar Tailwind e componentes existentes antes de criar novo componente

### Criterio de aceite
- nenhum botao irmao com altura diferente na mesma linha
- nenhum texto longo quebra layout

### Evidencia esperada
- capturas em 360, 390 e 430 px

### Risco comum
- aplicar classes de forma desigual e gerar inconsistencia entre telas

### Correcao esperada
- consolidar classes base reutilizaveis quando necessario

## Etapa 05 - Reescrever `PwaSearchPage`
### Objetivo
Parar de espelhar a tela web.

### Arquivos
- `src/pwa/pages/PwaSearchPage.tsx`
- componentes auxiliares PWA, se necessarios

### Como fazer
- remover import de `@/pages/Search`
- montar uma tela propria com:
  - campo de busca no topo
  - area de resultados
  - estado loading
  - estado vazio
  - estado erro
- manter navegacao para receitas no namespace PWA

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Dependencia
- reaproveitar hooks e repositorios ja existentes

### Criterio de aceite
- `PwaSearchPage` nao importa mais a tela web
- a tela parece app e nao pagina web reaproveitada

### Evidencia esperada
- diff do arquivo
- captura da busca em mobile

### Risco comum
- duplicar logica de dados sem reaproveitar camadas existentes

### Correcao esperada
- reaproveitar dados e hooks; trocar apenas a camada visual

## Etapa 06 - Reescrever `PwaRecipePage`
### Objetivo
Parar de espelhar a tela web de receita.

### Arquivos
- `src/pwa/pages/PwaRecipePage.tsx`
- componentes auxiliares PWA, se necessarios

### Como fazer
- remover import de `@/pages/RecipePage`
- montar uma tela propria com:
  - capa ou imagem principal
  - titulo e metadados
  - acoes principais alinhadas
  - blocos de conteudo com leitura confortavel
  - navegacao de retorno coerente com app
- conter textos longos e blocos extensos

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Dependencia
- reaproveitar camada de dados e apresentacao ja existente

### Criterio de aceite
- `PwaRecipePage` nao importa mais a tela web
- a tela parece app e nao pagina web reaproveitada

### Evidencia esperada
- diff do arquivo
- captura da receita em mobile

### Risco comum
- alterar o consumo de dados da receita e quebrar slug ou renderizacao

### Correcao esperada
- manter a fonte de dados e reescrever apenas a experiencia visual

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
- garantir que a entry page pareca porta de app

### Comandos
- editar arquivos
- `npm run lint`
- `npm run typecheck`

### Dependencia
- nenhuma

### Criterio de aceite
- navegacao parece de app
- entry page parece porta de app

### Evidencia esperada
- capturas de entry, top bar e bottom nav em mobile

### Risco comum
- exagerar no redesign e quebrar coerencia com o restante da identidade

### Correcao esperada
- melhorar densidade e estrutura mantendo a identidade existente

## Etapa 08 - Validar manifesto e update flow
### Objetivo
Garantir instalabilidade sem mexer no que ja esta correto.

### Arquivos
- `vite.config.ts`
- assets de icone, se necessario
- componentes de update e install, se necessario

### Como fazer
- preservar `display: standalone`
- preservar `start_url: /pwa/entry`
- preservar `scope: /pwa/`
- validar caminhos dos icones
- validar update banner
- nao ampliar para offline real

### Comandos
- `npm run build`
- validar app instalado em ambiente suportado

### Dependencia
- nenhuma

### Criterio de aceite
- instalacao continua funcionando
- update flow continua funcionando

### Evidencia esperada
- captura do manifesto
- evidencia visual de instalacao

### Risco comum
- alterar manifesto sem necessidade e quebrar instalacao

### Correcao esperada
- so tocar no manifesto se houver falha real comprovada

## Etapa 09 - Ampliar testes
### Objetivo
Cobrir a nova governanca PWA.

### Arquivos
- `tests/pwa.spec.ts`

### Como fazer
- adicionar asserts para `Instalar aplicativo`
- garantir ausencia de `Instalar App`
- validar ausencia do CTA nos contextos proibidos
- validar os 3 fluxos criticos
- validar viewports 360, 390 e 430

### Comandos
- `npm run test:e2e`

### Dependencia
- usar Playwright ja existente

### Criterio de aceite
- suite verde

### Evidencia esperada
- output do Playwright

### Risco comum
- escrever teste fraco que valida texto mas nao o contexto

### Correcao esperada
- validar rota e superficie, nao so string isolada
