# Resumo Para o Agente Executor

Leia primeiro:

1. `01-PRD-PWA-ONLINE.md`
2. `02-TAREFAS-EXECUTAVEIS-PWA-ONLINE.md`
3. `03-PATCHES-PENDENTES-PWA-ONLINE.md`
4. `04-CHECKLIST-VALIDACAO-PWA-ONLINE.md`
5. `05-NAO-FAZER-NESTA-FASE-ONLINE.md`

## Ordem imperativa de execução

- Trabalhe direto na `main`.
- Não crie branch.
- Não crie pasta nova dentro de `IMPLANTAR/PWA`.
- Aplique o patch de `index.html`.
- Aplique o patch de `vite.config.ts`.
- Aplique o patch de `src/components/layout/InstallAppButton.tsx`.
- Aplique o patch de `src/pwa/components/PwaInstallHintIOS.tsx`.
- Não implemente nada de offline.
- Não mexa em IndexedDB.
- Não adicione cache de API no SW.
- Rode lint, typecheck, build, unit e Playwright PWA.
- Valide Android, iOS e desktop.
- Só encerre quando todo o checklist estiver marcado.

## Definição curta de pronto

A entrega online está pronta quando:

- a PWA instala
- o CTA é `Instalar aplicativo`
- o app abre por `/pwa/entry`
- o SW não cacheia API
- o iOS hint não promete offline
- o app não regrediu

**Responda APROVADO ONLINE para eu gerar o PRD PWA OFFLINE.**
