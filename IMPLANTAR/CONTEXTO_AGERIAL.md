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

---
*Última atualização: 2026-04-06 por Antigravity (Gemini 3 Flash)*
