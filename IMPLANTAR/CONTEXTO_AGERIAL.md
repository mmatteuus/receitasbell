# Contexto Geral do Projeto: Receitas Bell

Este documento serve como a fonte da verdade para todos os agentes de IA que trabalham no projeto **Receitas Bell**. Ele deve ser lido integralmente antes de qualquer ação.

## 🎯 Objetivo do Projeto

O Receitas Bell é uma plataforma de receitas com sistema de administração, autenticação via Supabase e integração de pagamentos via Stripe Connect.

## 📜 Regras de Ouro para Agentes (Protocolo de Harmonia)

Para evitar conflitos, redundâncias e erros, todos os agentes DEVEM seguir estas regras:

1. **Registro de Atividade**: Antes de iniciar QUALQUER tarefa, o agente deve registrar no arquivo `implantar/TAREFAS_PENDENTES.md` que está "EM EXECUÇÃO" por [Nome do Agente/Modelo].
2. **Atualização de Contexto**: Após concluir uma tarefa ou etapa significativa, o agente DEVE atualizar este arquivo (`CONTEXTO_AGERIAL.md`) e o `TAREFAS_PENDENTES.md`.
3. **Previsão de Erros**: Antes de aplicar uma mudança, o agente deve "pensar à frente", prever possíveis quebras (ex: quebra de build, erro de tipagem, erro de roteamento) e validar via `npm run gate` se possível.
4. **Comunicação por Arquivos**: Utilize a pasta `implantar/` como o único local de handoff. Se um agente parou, o estado deve estar claro nos arquivos.
5. **Não Repetir Trabalho**: Verifique sempre o histórico para não refazer o que já foi validado.
6. **Prioridade Antigravity (Stripe/Navegador)**: O agente **Antigravity** tem prioridade absoluta em tarefas que envolvam o Stripe ou o uso do navegador (interação direta com sistemas externos).
7. **Responsabilidade de Deploy**: Qualquer agente que realizar alterações deve, se possível, fazer o deploy e acompanhar o status para garantir que deu certo. Caso um agente não consiga ou falhe no deploy, o **Antigravity** deve obrigatoriamente revisar, avaliar o que foi feito e corrigir o erro.

## 🚀 O que já foi feito (Resumo Consolidado)

- **Infraestrutura e Deploy**:
  - Deploy estável na Vercel (Branch `main`).
  - Configuração do `vercel.json` corrigida para build resiliente (`npm install --include=dev`).
  - Roteamento de API estabilizado (rewrites para `/api/payments` e `/api/admin`).
  - Gate de testes (`vitest` + `eslint`) passando.

- **Stripe Connect**:
  - Integração técnica concluída.
  - Webhooks configurados e variáveis de ambiente (`STRIPE_WEBHOOK_SECRET`) ativas.
  - Onboarding de conta conectada validado e funcional.
  - UI de administração preparada para lidar com erros de conexão e status de conta.

- **Interface (UI/UX)**:
  - Sidebar administrativa fixa e responsiva.
  - Melhorias na Home (Placeholders de imagem, categorias em ícones).
  - Fluxo de "Instalar App" movido para o header.

## 📍 Estado Atual e Bloqueios

- **Autenticação**: A infraestrutura está pronta, mas em produção houve erros de "Organization not identified" ou credenciais 401. O foco atual é estabilizar o login, signup e recuperação de senha.
- **Stripe**: Preparação para migração definitiva para credenciais de produção (sk_live).

## 🧾 Registro de Atividades (Agentes)

- 2026-04-06: Antigravity validou via navegador que o login funciona, mas a home do tenant (`/t/receitasbell`) retorna 404. Botão PWA ausente.
- 2026-04-06: Antigravity delegou correções de Front-End e Backend; pastas arquivadas foram deletadas para limpeza total.
- 2026-04-06: OpenCode releu `implantar/CONTEXTO_AGERIAL.md` e registrou a atividade no fluxo de `implantar/TAREFAS_PENDENTES.md`.
- 2026-04-06: OpenCode executou `npm run gate` com sucesso (lint, typecheck, build, tests). Avisos: `NODE_ENV=production` no `.env`, chunks > 500 kB, e "Session DB insert failed, falling back to stateless" no vitest.
- 2026-04-06: Claude Code (Haiku 4.5) assumiu frente de bugs críticos:
  - **Bug #1 (RESOLVIDO)**: Rota `/t/:tenantSlug` faltando para homepage do tenant. Adicionada ao `router.tsx` com espelhamento de todas as rotas públicas.
  - **Bug #2 (VALIDADO)**: InstallAppButton não é bug — é comportamento normal da Web (só aparece quando `beforeinstallprompt` é disparado).
  - **Vitest (CORRIGIDO)**: Mudado `environment` de `node` para `jsdom` no `vitest.config.ts` para suportar `afterEach` no setup.
  - **Gate Status**: ✅ Lint OK | ✅ Typecheck OK | ✅ Build OK | ✅ Tests 70/70 passed

---

_Última atualização: 2026-04-06 por Claude Code (Haiku 4.5)_
