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

### Aceite
- o usuario entende rapidamente que esta entrando no aplicativo

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

### Aceite
- o login parece tela de app e nao pagina web generica

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

### Aceite
- o usuario autenticado sente uma shell de app online limpa

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

### Aceite
- busca confortavel em 360, 390 e 430 px

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

### Aceite
- a receita pode ser consumida como tela de app instalada

## `Header` web
### Deve ter
- navegacao web legitima

### Nao deve ter
- CTA de instalacao

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
