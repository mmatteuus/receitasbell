# Checklist de validacao - PWA Online

## Instalacao
- [ ] O CTA usa exatamente `Instalar aplicativo`
- [ ] O CTA aparece em `/pwa/entry`
- [ ] O CTA aparece em `/pwa/login`, quando suportado
- [ ] O CTA aparece no header ao lado do carrinho por instrucao explicita do usuario
- [ ] O CTA nao aparece em `AccountHome`
- [ ] O CTA nao aparece em `AdminLayout` web
- [ ] Android recebe prompt quando suportado
- [ ] iOS exibe instrucao manual clara

## Namespace PWA
- [ ] Todas as rotas `/pwa/**` permanecem visualmente no contexto PWA
- [ ] Login redireciona de volta ao destino salvo
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

## Paginas criticas
- [ ] `PwaSearchPage` nao espelha a pagina web
- [ ] `PwaRecipePage` nao espelha a pagina web
- [ ] `PwaEntryPage` parece porta de app
- [ ] `UserLoginPage` e compacta e mobile-first

## Online only
- [ ] Shell PWA nao comunica offline real
- [ ] Nao ha fila offline
- [ ] Nao ha sync offline
- [ ] Nao ha conflito offline

## Testes
- [ ] Playwright cobre 360px
- [ ] Playwright cobre 390px
- [ ] Playwright cobre 430px
- [ ] Testes validam o label exato do CTA
