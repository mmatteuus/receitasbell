# Plano de testes - PWA Online

## Viewports obrigatorios
- 360x800
- 390x844
- 430x932

## Casos obrigatorios

### Instalacao
- validar presenca do CTA `Instalar aplicativo` em `/pwa/entry`
- validar presenca do CTA `Instalar aplicativo` em `/pwa/login`, quando suportado
- validar ausencia do CTA em `Header`, `AccountHome` e `AdminLayout` web
- validar ausencia do texto antigo `Instalar App`

### Namespace PWA
- acessar `/pwa/app` sem sessao e validar redirect para `/pwa/login`
- acessar `/pwa/app/buscar` sem escapar para namespace web
- acessar `/pwa/app/receitas/:slug` sem escapar para namespace web

### Experiencia app-like
- validar top bar e bottom nav em viewport movel
- validar ausencia de overflow horizontal
- validar padronizacao de alturas de campos e botoes
- validar truncamento de textos longos
- validar safe-area no topo e no rodape

### Update flow
- validar exibicao do banner de update quando houver nova versao
- validar acao explicita de recarregar, se existente

## Automacao
- ampliar `tests/pwa.spec.ts`
- usar viewports moveis no Playwright
- adicionar asserts para o label exato do CTA

## Evidencias esperadas
- output verde do Playwright
- capturas das rotas criticas
- registro visual do manifesto e installability
