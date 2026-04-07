# Aceite por tela - PWA Online

## `/pwa/entry`
### Deve ter
- cara de porta de entrada do aplicativo
- CTA `Instalar aplicativo` quando suportado
- instrucao clara para iOS quando aplicavel
- densidade visual de app

### Nao deve ter
- cara de landing page institucional
- excesso de texto
- CTA com nome diferente

## `/pwa/login`
### Deve ter
- fluxo de login claro e compacto
- CTA `Instalar aplicativo` somente se fizer sentido no suporte atual
- teclado mobile correto por tipo de campo
- foco visual claro

### Nao deve ter
- blocos grandes desnecessarios
- espacos mortos excessivos
- experiencia de site desktop espremido

## `/pwa/app`
### Deve ter
- shell limpa
- top bar compacta
- bottom nav compacta
- safe-area correta

### Nao deve ter
- mensagens de offline pronto
- conflito offline
- sync center

## `/pwa/app/buscar`
### Deve ter
- campo de busca acessivel e confortavel
- resultados organizados para mobile
- estado loading
- estado vazio
- estado erro

### Nao deve ter
- import direto da pagina web tradicional
- chrome web
- overflow horizontal

## `/pwa/app/receitas/:slug`
### Deve ter
- hierarquia clara de titulo, metadados e conteudo
- acoes principais alinhadas
- leitura confortavel no mobile
- navegacao de retorno coerente com app

### Nao deve ter
- import direto da pagina web tradicional
- blocos largos com cara de desktop
- texto quebrando layout

## `Header` web
### Deve ter
- navegacao web legitima
- CTA ao lado do carrinho por instrucao explicita do usuario

### Nao deve ter
- instalacao espalhada em outros pontos web genericos

## `AccountHome` web
### Deve ter
- funcoes de conta preservadas

### Nao deve ter
- card ou CTA de instalacao

## `AdminLayout` web
### Deve ter
- funcoes administrativas preservadas

### Nao deve ter
- CTA de instalacao
