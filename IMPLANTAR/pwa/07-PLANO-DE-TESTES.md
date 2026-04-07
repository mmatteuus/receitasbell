# Plano de testes - PWA Online

## Viewports obrigatorios
- 360x800
- 390x844
- 430x932

## Casos obrigatorios

### Instalacao
- validar presenca do CTA `Instalar aplicativo` em `/pwa/entry`
- validar presenca do CTA `Instalar aplicativo` em `/pwa/login`, quando suportado
- validar presenca do CTA no header ao lado do carrinho somente porque houve instrucao explicita do usuario
- validar ausencia do texto antigo `Instalar App`

### Contextos proibidos
- validar ausencia do CTA em `AccountHome`
- validar ausencia do CTA em `AdminLayout` web

### Namespace PWA
- acessar `/pwa/app` sem sessao e validar redirect para `/pwa/login`
- acessar `/pwa/app/buscar` sem escapar para namespace web
- acessar `/pwa/app/receitas/:slug` sem escapar para namespace web

### Experiencia app-like
- validar top bar e bottom nav em viewport movel
- validar ausencia de overflow horizontal
- validar padronizacao de alturas de campos e botoes
- validar safe-area no topo e no rodape

### Update flow
- validar exibicao do banner de update quando houver nova versao

## Automacao
- ampliar `tests/pwa.spec.ts`
- usar Playwright em viewports moveis
- adicionar asserts para o label exato do CTA
