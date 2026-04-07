# Tarefas Pendentes: Receitas Bell

Este documento lista o que falta para estabilizar o sistema e entregar o projeto com qualidade.

> [!NOTE]
> **REGRAS PARA AGENTES:**
>
> - Ao assumir uma tarefa, adicione: `[EM EXECUÇÃO - Nome do Agente]`
> - Ao finalizar, mova para o arquivo `implantar/HISTORICO_CONCLUIDO.md` ou adicione `[X]` e aguarde revisão.

## 🎯 Prioridades Estratégicas (Orquestração Backend Agent)

### 🔥 P0: Estabilidade Financeira & Acesso Admin

- [ ] **Stripe Connect Produção + Reset Senha Admin**: **(CRÍTICO - DELEGADO)** Ver detalhes completos em `TAREFA-P0-STRIPE-PRODUCAO.md`. Configurar Stripe em modo LIVE com account conectado real + resetar senha admin para `Receitasbell.com`. `[AGUARDANDO EXECUÇÃO - Antigravity/OpenCode]`

### 🔑 P1: Fluxos de Autenticação Críticos (Front-End)

- [x] **Corrigir 404 Home do Tenant**: A rota `https://receitasbell.mtsferreira.dev/t/receitasbell` está retornando erro 404. Bloqueio crítico de vendas. `[CONCLUÍDO - OpenCode - 2026-04-06]`
- [x] **Recuperação de Senha**: Finalizar e polir o fluxo de "Esqueci minha senha" integrado ao Resend/Supabase Auth. `[CONCLUÍDO - OpenCode - 2026-04-06]`
- [x] **Validação de Convites Admin**: Garantir que apenas quem deve entrar, consiga se cadastrar. `[CONCLUÍDO - Antigravity - 2026-04-07]`

### 🛡️ P2: Backend - Auditoria e Hardening

- [x] **Auditoria de Webhooks & Ações**: Validar transações e registrar logs de auditoria. `[CONCLUÍDO - Antigravity - 2026-04-07]`
- [x] **Logs de Produção e Sentry**: Implementar monitoramento preventivo para capturar erros 500 antes que o usuário reporte. `[CONCLUÍDO - OpenCode - 2026-04-06]`
- [ ] **Migração de Schema Final**: Garantir integridade total das tabelas de `tenants` e `receipts`.

### 🚀 P3: Produtização & SEO (Handoff Final)

- [x] **Refinamento SEO & Meta Tags**: Títulos únicos e amigáveis para indexação do PWA no Google. (lint/typecheck/build ok; `npm run test:unit` ok; warnings: NODE_ENV em `.env`, chunks > 500 kB)
- [ ] **Instalação PWA**: Reforçar a sinalização de "Adicionar à tela inicial" no painel.

### 🧭 Coordenação (OpenCode)

- [x] **Registro de atividade e dossiê**: Verificar criação de `IMPLANTAR/50-DOSSIE-PRODUCAO-STRIPE.md` e registrar handoff. `[CONCLUÍDO - OpenCode - 2026-04-06]`

---

## 🛡️ Proteção de Futuro (Previsão de Erros)

Para evitar que erros futuros ocorram sem aviso:

1. **Ratelimit Inteligente**: Implementado `@upstash/ratelimit` em rotas sensíveis via `withApiHandler`. [X]
2. **Audit Logs**: Implementado registro de ações administrativas e tentativas no banco. [X]
3. **Health Check Automático**: Script de `npm run gate` validado e headers de segurança/SLO integrados. [X]

---

_Última atualização: 2026-04-06 por Backend Agent (Claude Sonnet 4.5)_
_Desenvolvido por: MtsFerreira - mtsferreira.dev_
