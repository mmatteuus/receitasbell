# Aceite por arquivo alterado - PWA Online

## Regra de uso
Antes de considerar uma etapa concluida, validar o aceite do arquivo alterado correspondente.

## `src/pwa/components/InstallAppButton.tsx`
### Deve ficar verdadeiro
- o label visivel do CTA e exatamente `Instalar aplicativo`
- o componente continua retornando `null` quando o app ja estiver instalado
- a logica de `beforeinstallprompt` continua funcional
- a assinatura publica do componente nao muda

### Nao pode acontecer
- renomear props
- alterar `InstallContext`
- introduzir dependencia nova

### Aceite
- compila sem quebrar nenhum uso existente do botao

## `src/pwa/entry/PwaEntryPage.tsx`
### Deve ficar verdadeiro
- a tela parece entrada de aplicativo
- o CTA de instalacao usa o nome correto
- a tela nao parece landing page institucional
- o fluxo conduz para autenticacao ou continuidade no app

### Nao pode acontecer
- excesso de texto promocional
- blocos web genericos sem densidade de app

### Aceite
- o usuario entende rapidamente que esta entrando no aplicativo

## `src/pwa/pages/UserLoginPage.tsx`
### Deve ficar verdadeiro
- a tela fica compacta e mobile-first
- o CTA de instalacao, quando existir, usa o nome correto
- os campos ficam confortaveis para toque e teclado mobile
- o fluxo de login continua funcionando

### Nao pode acontecer
- regressao no login
- regressao no redirect apos autenticacao

### Aceite
- login continua funcional e visualmente com cara de app

## `src/pwa/pages/AdminLoginPage.tsx`
### Deve ficar verdadeiro
- a tela preserva acesso administrativo PWA, se existente
- a tela nao vira ponto primario de instalacao indevida
- a visualidade continua coerente com o PWA

### Nao pode acontecer
- quebra do login admin

### Aceite
- admin login continua acessivel e coerente

## `src/pages/AccountHome.tsx`
### Deve ficar verdadeiro
- toda funcionalidade atual de conta permanece
- o CTA ou card de instalacao desaparece
- nenhuma referencia a `InstallAppButton` permanece

### Nao pode acontecer
- quebra de favoritos, compras, resumo ou autenticacao

### Aceite
- conta web continua funcional sem oferecer instalacao

## `src/components/layout/AdminLayout.tsx`
### Deve ficar verdadeiro
- layout admin continua funcional
- `InstallAppButton` deixa de existir no header admin
- notificacoes e navegacao admin continuam intactas

### Nao pode acontecer
- quebra de sidebar
- quebra de breadcrumbs
- quebra de notificacoes

### Aceite
- admin web segue funcionando sem CTA de instalacao

## `src/components/layout/Header.tsx`
### Deve ficar verdadeiro
- navegacao web continua intacta
- menu mobile continua intacto
- o CTA de instalacao e removido do header e do menu mobile

### Nao pode acontecer
- perder links legitimos
- quebrar cartao de carrinho
- quebrar alternancia de tema
- quebrar acesso admin

### Aceite
- header web continua funcional sem instalacao

## `src/pwa/app/shell/UserPwaShell.tsx`
### Deve ficar verdadeiro
- auth redirect continua funcional
- top bar continua funcional
- bottom nav continua funcional
- update banner continua funcional
- safe-area continua correta

### Deve deixar de existir nesta fase
- mensagem de offline pronto
- conflito offline
- sync center exposto ao usuario
- pendencias offline exibidas como produto pronto

### Nao pode acontecer
- tela em branco apos autenticacao
- quebra do redirect para login PWA

### Aceite
- shell online limpa e utilizavel

## `src/pwa/app/navigation/PwaTopBar.tsx`
### Deve ficar verdadeiro
- top bar compacta
- sem desperdicio grande de altura
- navegacao de retorno previsivel
- safe-area respeitada

### Nao pode acontecer
- header alto demais
- icones desalinhados

### Aceite
- top bar com cara de app

## `src/pwa/app/navigation/PwaBottomNav.tsx`
### Deve ficar verdadeiro
- bottom nav compacta
- targets de toque confortaveis
- alinhamento consistente
- safe-area respeitada

### Nao pode acontecer
- item espremido
- label quebrando layout
- navegacao desalinhada

### Aceite
- bottom nav com cara de app instalada

## `src/pwa/pages/PwaSearchPage.tsx`
### Deve ficar verdadeiro
- o arquivo nao importa mais `@/pages/Search`
- a tela tem layout proprio para mobile
- existem estados loading, vazio e erro
- a navegacao segue em `/pwa/**`

### Nao pode acontecer
- duplicar regra de negocio desnecessariamente
- desviar para rota web

### Aceite
- busca PWA propria e funcional

## `src/pwa/pages/PwaRecipePage.tsx`
### Deve ficar verdadeiro
- o arquivo nao importa mais `@/pages/RecipePage`
- a tela tem layout proprio para mobile
- leitura e acoes ficam confortaveis em dispositivo movel
- navegacao de retorno faz sentido no contexto PWA

### Nao pode acontecer
- quebrar carregamento por slug
- voltar a apresentar layout web tradicional

### Aceite
- receita PWA propria e funcional

## `tests/pwa.spec.ts`
### Deve ficar verdadeiro
- existe validacao do label `Instalar aplicativo`
- existe validacao da ausencia de `Instalar App`
- existe validacao de ausencia do CTA nos contextos proibidos
- existem validacoes dos 3 fluxos criticos
- existem viewports moveis relevantes

### Nao pode acontecer
- teste fragil baseado apenas em string fora de contexto

### Aceite
- suite cobre governanca PWA online de forma util

## `vite.config.ts`
### Deve ficar verdadeiro
- `display: standalone` permanece
- `start_url: /pwa/entry` permanece, salvo falha comprovada
- `scope: /pwa/` permanece, salvo falha comprovada
- build PWA continua funcional

### Nao pode acontecer
- mexer no manifesto sem motivo comprovado
- ampliar SW para offline real

### Aceite
- instalacao e build continuam funcionais
