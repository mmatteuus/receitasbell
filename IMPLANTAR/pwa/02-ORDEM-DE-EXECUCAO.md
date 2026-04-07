# Ordem exata de execucao - PWA Online

## Regra geral
Executar uma etapa por vez. Nao pular. Nao reinterpretar. Nao misturar online com offline.

## Etapa 01 - Corrigir o CTA de instalacao
### Objetivo
Padronizar o nome e a governanca do CTA.

### Arquivos
- `src/pwa/components/InstallAppButton.tsx`
- `src/pwa/entry/PwaEntryPage.tsx`
- `src/pwa/pages/UserLoginPage.tsx`

### Fazer
- trocar `Instalar App` por `Instalar aplicativo`
- manter exibicao somente quando o app nao estiver instalado
- manter suporte a `beforeinstallprompt`
- manter o caminho de instrucao manual para iOS

### Criterio de aceite
- nenhum CTA de instalacao usa nome diferente de `Instalar aplicativo`

## Etapa 02 - Remover vazamentos de instalacao
### Objetivo
Remover o CTA de instalacao dos contextos errados.

### Arquivos
- `src/pages/AccountHome.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/Header.tsx`

### Fazer
- remover `InstallAppButton`
- remover imports relacionados
- remover cards ou blocos de instalacao desses contextos

### Criterio de aceite
- conta web, header web e admin web nao mostram mais instalacao

## Etapa 03 - Isolar a shell PWA da camada offline
### Objetivo
Deixar a shell da fase online sem prometer offline pronto.

### Arquivos
- `src/pwa/app/shell/UserPwaShell.tsx`
- dependencias imediatas da shell

### Fazer
- remover ou neutralizar banners e fluxos de offline real
- manter update banner, auth redirect, top bar, bottom nav e safe-area

### Criterio de aceite
- a shell nao comunica sync offline, conflito offline ou modo offline pronto

## Etapa 04 - Padronizar UI mobile do namespace PWA
### Objetivo
Aplicar consistencia visual de app.

### Arquivos
- componentes PWA reutilizados
- formularios PWA
- navegacao PWA

### Fazer
- campos com no minimo `48px`
- botoes com no minimo `48px`
- itens tocaveis com no minimo `56px`
- truncamento e clamp para textos longos
- zero overflow horizontal
- alinhamento consistente entre botoes e campos

### Criterio de aceite
- nenhum botao irmao com altura diferente
- nenhum texto longo quebra layout

## Etapa 05 - Reescrever `PwaSearchPage`
### Objetivo
Transformar busca PWA em tela propria.

### Arquivos
- `src/pwa/pages/PwaSearchPage.tsx`
- componentes auxiliares que forem necessarios

### Fazer
- remover import de `@/pages/Search`
- criar layout mobile-first proprio
- criar estados loading, empty e error proprios
- manter navegacao dentro de `/pwa/**`

### Criterio de aceite
- a busca PWA nao espelha a pagina web

## Etapa 06 - Reescrever `PwaRecipePage`
### Objetivo
Transformar receita PWA em tela propria.

### Arquivos
- `src/pwa/pages/PwaRecipePage.tsx`
- componentes auxiliares que forem necessarios

### Fazer
- remover import de `@/pages/RecipePage`
- criar layout de app para leitura e acoes
- alinhar CTAs e blocos de informacao
- conter textos longos e blocos extensos

### Criterio de aceite
- a receita PWA nao espelha a pagina web

## Etapa 07 - Refinar chrome de app
### Objetivo
Aproximar a experiencia de um aplicativo instalado.

### Arquivos
- `src/pwa/app/navigation/PwaTopBar.tsx`
- `src/pwa/app/navigation/PwaBottomNav.tsx`
- `src/pwa/entry/PwaEntryPage.tsx`

### Fazer
- revisar densidade visual
- revisar safe-area
- revisar targets de toque
- revisar navegacao de retorno
- eliminar espacos mortos grandes

### Criterio de aceite
- o PWA parece app e nao pagina institucional

## Etapa 08 - Validar manifesto, icones e update flow
### Objetivo
Fechar instalabilidade e atualizacao.

### Arquivos
- `vite.config.ts`
- `public/pwa/icons/**`
- componentes de install e update

### Fazer
- validar manifesto
- validar caminhos de icones
- validar instalacao Android
- validar instrucao iOS
- validar update banner

### Criterio de aceite
- instalacao funciona e update nao quebra fluxo critico

## Etapa 09 - Ampliar testes
### Objetivo
Cobrir mobile real e governanca PWA.

### Arquivos
- `tests/pwa.spec.ts`
- testes auxiliares, se necessario

### Fazer
- validar CTA exato
- validar ausencia do CTA nos contextos proibidos
- validar viewports 360, 390 e 430
- validar 3 fluxos criticos

### Criterio de aceite
- suite verde e evidencias geradas

## Etapa 10 - Fechar aceite
### Objetivo
Confirmar fim da fase online.

### Fazer
- executar checklist final
- anexar evidencias
- confirmar que nada de offline real foi implementado

### Criterio de aceite
- Definition of Done online totalmente cumprida
