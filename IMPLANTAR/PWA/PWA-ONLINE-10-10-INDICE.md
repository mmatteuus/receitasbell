# PWA Online 10/10 — Índice Final

## Escopo

Este conjunto substitui logicamente o dossiê anterior e cobre **somente o restante que ainda falta** para o PWA online ficar **10/10**.

## O que já está aplicado no código

- `index.html` com `viewport-fit=cover`
- metas iOS de web app presentes
- `theme-color` alinhado
- manifest com `start_url: '/pwa/entry'`
- `runtimeCaching` de API removido do SW
- hint iOS sem promessa de offline
- CTA visível principal em `Instalar aplicativo`

## O que ainda falta

1. eliminar o último texto residual `Instalar app`
2. alinhar `tests/pwa.spec.ts` com a UI e rotas atuais
3. decidir e executar consolidação segura da duplicidade de hooks/componentes de instalação
4. executar validações reais que eu não consigo rodar daqui

## Ordem de leitura

1. `PWA-ONLINE-10-10-AUDITORIA-FINAL.md`
2. `PWA-ONLINE-10-10-TAREFAS-RESTANTES.md`
3. `PWA-ONLINE-10-10-PATCHES-RESTANTES.md`
4. `PWA-ONLINE-10-10-VALIDACAO-OBRIGATORIA.md`
5. `PWA-ONLINE-10-10-LIMITES-E-RISCOS.md`
6. `PWA-ONLINE-10-10-HANDOFF-FINAL.md`

## Regras invioláveis

- trabalhar na `main`
- não criar branch
- não tocar em offline
- não criar nova pasta dentro de `IMPLANTAR/PWA`
- não refatorar além do necessário para fechar o online
