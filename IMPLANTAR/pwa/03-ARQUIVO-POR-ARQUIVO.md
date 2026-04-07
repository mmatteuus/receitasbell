# Plano arquivo por arquivo

## `src/pwa/components/InstallAppButton.tsx`
- trocar o label para `Instalar aplicativo`
- manter suporte a `beforeinstallprompt`
- nao alterar API publica do componente

## `src/pages/AccountHome.tsx`
- remover CTA de instalacao do perfil web
- preservar todas as funcoes de conta

## `src/components/layout/AdminLayout.tsx`
- remover CTA de instalacao do admin web
- preservar sidebar, breadcrumbs e notificacoes

## `src/components/layout/Header.tsx`
- colocar o botao de instalacao ao lado do carrinho quando houver instrucao explicita do usuario
- remover instalacao de pontos proibidos que nao tenham instrucao mais recente em contrario
- preservar navegacao, carrinho, tema e acesso admin

## `src/pwa/app/shell/UserPwaShell.tsx`
- remover sinais de offline pronto
- preservar auth redirect, top bar, bottom nav, update banner e safe-area

## `src/pwa/pages/PwaSearchPage.tsx`
- nao importar `@/pages/Search`
- criar tela propria de app

## `src/pwa/pages/PwaRecipePage.tsx`
- nao importar `@/pages/RecipePage`
- criar tela propria de app

## `tests/pwa.spec.ts`
- validar CTA exato
- validar ausencia do CTA nos contextos proibidos
- validar os 3 fluxos criticos
