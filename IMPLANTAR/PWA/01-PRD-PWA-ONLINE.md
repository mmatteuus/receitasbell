# PRD PWA Online

## Snapshot do projeto
- React 18 + TypeScript + Vite 6
- React Router 6
- Tailwind CSS
- `vite-plugin-pwa`
- namespace PWA existente em `/pwa/**`

## Fatos principais
- o manifest atual usa `display: standalone`
- o `start_url` atual e `/pwa/entry`
- o `scope` atual e `/pwa/`
- existe `InstallAppButton`
- o texto atual do CTA precisa ser corrigido para `Instalar aplicativo`
- o CTA vazou para contextos web e admin indevidos
- `PwaSearchPage` ainda espelha a web
- `PwaRecipePage` ainda espelha a web
- a shell PWA ainda mistura sinais da fase offline

## Objetivo da fase
Entregar somente PWA ONLINE com sensacao de aplicativo instalado em mobile, sem quebrar o projeto.

## Resultado esperado
- o CTA correto aparece apenas em superficies PWA corretas
- a experiencia parece app, nao site
- busca e receita PWA sao telas proprias
- shell PWA fica limpa para uso online
- web tradicional deixa de oferecer instalacao como atalho principal
