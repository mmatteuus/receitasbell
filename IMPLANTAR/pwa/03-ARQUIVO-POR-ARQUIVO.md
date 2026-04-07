# Plano arquivo por arquivo

## `src/pwa/components/InstallAppButton.tsx`
### Objetivo
Corrigir naming e governanca do CTA.

### Fazer
- trocar o label para `Instalar aplicativo`
- manter suporte a `beforeinstallprompt`
- nao exibir se ja estiver instalado
- manter compatibilidade com iOS por instrucao externa

### Criterio de aceite
- nenhum outro texto de instalacao existe neste componente

---

## `src/pages/AccountHome.tsx`
### Objetivo
Remover CTA de instalacao do perfil e minha conta web.

### Fazer
- remover import de `InstallAppButton`
- remover bloco ou card de aplicativo
- remover dependencia visual de instalacao

### Criterio de aceite
- nenhuma referencia a `InstallAppButton`

---

## `src/components/layout/AdminLayout.tsx`
### Objetivo
Remover CTA de instalacao do admin web.

### Fazer
- remover `InstallAppButton`
- remover import correspondente
- manter apenas acoes administrativas

### Criterio de aceite
- header admin sem CTA de instalacao

---

## `src/components/layout/Header.tsx`
### Objetivo
Garantir que header web global nao seja ponto de instalacao.

### Fazer
- remover qualquer CTA ou atalho de instalacao
- nao induzir instalacao fora do namespace PWA

### Criterio de aceite
- header web sem CTA de instalacao

---

## `src/pwa/app/shell/UserPwaShell.tsx`
### Objetivo
Ficar com comportamento de shell online.

### Fazer
- remover sinais de offline pronto
- preservar safe-area
- preservar top bar e bottom nav
- preservar update banner
- preservar redirect de auth

### Criterio de aceite
- shell nao comunica sync, conflito ou offline pronto

---

## `src/pwa/pages/PwaSearchPage.tsx`
### Objetivo
Virar pagina PWA propria.

### Fazer
- nao importar `@/pages/Search`
- criar layout proprio de app
- ter estados loading, empty e error
- garantir toque confortavel

### Criterio de aceite
- experiencia claramente diferente da tela web

---

## `src/pwa/pages/PwaRecipePage.tsx`
### Objetivo
Virar pagina PWA propria.

### Fazer
- nao importar `@/pages/RecipePage`
- criar layout de app
- garantir acoes alinhadas
- garantir textos contidos

### Criterio de aceite
- experiencia claramente diferente da tela web

---

## `tests/pwa.spec.ts`
### Objetivo
Cobrir a governanca PWA online.

### Fazer
- validar CTA exato
- validar ausencia do CTA nos contextos proibidos
- validar 3 fluxos criticos
- validar viewports moveis

### Criterio de aceite
- suite verde
