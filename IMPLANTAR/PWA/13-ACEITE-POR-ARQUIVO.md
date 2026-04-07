# Aceite por arquivo alterado - PWA Online

## `src/pwa/components/InstallAppButton.tsx`
- deve exibir exatamente `Instalar aplicativo`
- nao deve mudar a API publica do componente
- deve continuar retornando `null` quando ja estiver instalado

## `src/pwa/entry/PwaEntryPage.tsx`
- deve parecer entrada de aplicativo
- deve conduzir para autenticacao ou continuidade no app
- nao deve parecer landing page institucional

## `src/pwa/pages/UserLoginPage.tsx`
- deve ficar compacta e mobile-first
- deve preservar login e redirect
- deve manter campos confortaveis para toque

## `src/pwa/pages/AdminLoginPage.tsx`
- deve preservar acesso administrativo PWA
- nao deve virar superficie primaria de instalacao

## `src/pages/AccountHome.tsx`
- deve preservar toda funcionalidade atual
- nao deve mais exibir CTA ou card de instalacao

## `src/components/layout/AdminLayout.tsx`
- deve preservar layout admin
- nao deve mais exibir CTA de instalacao

## `src/components/layout/Header.tsx`
- deve preservar navegacao, carrinho, tema e acesso admin
- deve manter o botao de instalacao ao lado do carrinho por instrucao explicita do usuario
- nao deve espalhar instalacao por outros pontos do header alem desse placement

## `src/pwa/app/shell/UserPwaShell.tsx`
- deve preservar auth redirect, top bar, bottom nav, update banner e safe-area
- deve deixar de comunicar offline pronto

## `src/pwa/app/navigation/PwaTopBar.tsx`
- deve ficar compacta e previsivel
- nao deve desperdiçar altura

## `src/pwa/app/navigation/PwaBottomNav.tsx`
- deve ficar compacta, alinhada e com targets confortaveis

## `src/pwa/pages/PwaSearchPage.tsx`
- nao deve mais importar `@/pages/Search`
- deve virar tela propria de app

## `src/pwa/pages/PwaRecipePage.tsx`
- nao deve mais importar `@/pages/RecipePage`
- deve virar tela propria de app

## `tests/pwa.spec.ts`
- deve validar `Instalar aplicativo`
- deve validar ausencia de `Instalar App`
- deve validar ausencia do CTA nos contextos proibidos
- deve validar os 3 fluxos criticos

## `vite.config.ts`
- deve preservar `display: standalone`
- deve preservar `start_url: /pwa/entry`
- deve preservar `scope: /pwa/`
- nao deve ampliar SW para offline real
