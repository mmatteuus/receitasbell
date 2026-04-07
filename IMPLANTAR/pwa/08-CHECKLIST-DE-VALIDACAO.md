# Checklist de validacao - PWA Online

## Instalacao
- [ ] O CTA usa exatamente `Instalar aplicativo`
- [ ] O CTA aparece apenas em superficies PWA permitidas
- [ ] O CTA nao aparece em `Header` web
- [ ] O CTA nao aparece em `AccountHome`
- [ ] O CTA nao aparece em `AdminLayout` web
- [ ] Android e Chrome recebem prompt quando suportado
- [ ] iOS exibe instrucao manual clara

## Namespace PWA
- [ ] Todas as rotas `/pwa/**` permanecem visualmente no contexto PWA
- [ ] Login redireciona de volta ao destino PWA salvo
- [ ] Nao ha fuga visual para chrome web

## Shell e chrome de app
- [ ] Top bar respeita safe-area
- [ ] Bottom nav respeita safe-area
- [ ] Nao ha overflow horizontal
- [ ] Nao ha espacos mortos grandes
- [ ] A navegacao de volta e previsivel

## Consistencia visual
- [ ] Campos do PWA tem altura padronizada
- [ ] Botoes do PWA tem altura padronizada
- [ ] Itens tocaveis tem area confortavel
- [ ] Botoes irmaos mantem mesma altura e alinhamento
- [ ] Textos longos sao truncados ou clampados
- [ ] Nenhum card quebra layout por texto grande

## Paginas criticas
- [ ] `PwaSearchPage` nao espelha a pagina web
- [ ] `PwaRecipePage` nao espelha a pagina web
- [ ] `PwaEntryPage` parece porta de app e nao pagina institucional
- [ ] `UserLoginPage` e compacta e mobile-first

## Online only
- [ ] Shell PWA nao comunica offline real
- [ ] Nao ha fila offline
- [ ] Nao ha sync offline
- [ ] Nao ha conflito offline
- [ ] O service worker permanece restrito a assets e update

## Acessibilidade
- [ ] Foco visivel
- [ ] Labels reais
- [ ] Erros associados aos campos
- [ ] Contraste adequado
- [ ] Acoes principais nao dependem de hover
- [ ] Motion respeita `prefers-reduced-motion` quando aplicavel

## Performance
- [ ] LCP <= 2.5s em mobile de referencia
- [ ] INP <= 200ms
- [ ] CLS <= 0.1
- [ ] Lighthouse mobile sem regressao relevante

## Testes
- [ ] Playwright cobre 360px
- [ ] Playwright cobre 390px
- [ ] Playwright cobre 430px
- [ ] Testes validam ausencia do CTA nos contextos proibidos
- [ ] Testes validam o label exato do CTA
