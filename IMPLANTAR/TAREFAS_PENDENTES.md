# Tarefas Pendentes: Receitas Bell

Este documento lista o que falta para estabilizar o sistema e entregar o projeto com qualidade.

> [!NOTE]
> **REGRAS PARA AGENTES:**
>
> - Ao assumir uma tarefa, adicione: `[EM EXECUÇÃO - Nome do Agente]`
> - Ao finalizar, mova para o arquivo `implantar/HISTORICO_CONCLUIDO.md` ou adicione `[X]` e aguarde revisão.

## 🎯 Prioridades Estratégicas (Orquestração Antigravity)

### 🔥 P1: Estabilidade Financeira & Dados (Backend/Infra)

- [ ] **Auditoria de Webhooks Stripe**: **(ALTA PRIORIDADE)** Validar no Supabase se as transações estão sendo registradas. Se o webhook falhar, o usuário paga e não recebe o produto. `[EM EXECUÇÃO - OpenCode]`
- [ ] **Reset de Senha Admin**: O login `mateus@receitasbell.com.br` está falhando. Resetar via SQL/Admin no Supabase para permitir auditoria. `[NOVO - Backend]`
- [x] **Logs de Produção e Sentry**: Implementar monitoramento preventivo para capturar erros 500 antes que o usuário reporte. `[CONCLUÍDO - OpenCode - 2026-04-06]`
- [ ] **Migração de Schema Final**: Garantir integridade total das tabelas de `tenants` e `receipts`.

### 🔑 P2: Fluxos de Autenticação Críticos (Front-End)

- [ ] **Corrigir 404 Home do Tenant**: A rota `https://receitasbell.mtsferreira.dev/t/receitasbell` está retornando erro 404. Bloqueio crítico de vendas. `[EM EXECUÇÃO - OpenCode]`
- [x] **Recuperação de Senha**: Finalizar e polir o fluxo de "Esqueci minha senha" integrado ao Resend/Supabase Auth. `[CONCLUÍDO - OpenCode - 2026-04-06]`
- [ ] **Validação de Convites Admin**: Garantir que apenas quem deve entrar, consiga se cadastrar.

### 🚀 P3: Produtização & SEO (Handoff Final)

- [ ] **Migração para Chaves LIVE (Stripe)**: O último passo antes do lançamento público. **(Exclusivo Antigravity)**
- [x] **Refinamento SEO & Meta Tags**: Títulos únicos e amigáveis para indexação do PWA no Google. (lint/typecheck/build ok; `npm run test:unit` ok; warnings: NODE_ENV em `.env`, chunks > 500 kB)
- [ ] **Instalação PWA**: Reforçar a sinalização de "Adicionar à tela inicial" no painel.

### 🧭 Coordenação (OpenCode)

- [x] **Registro de atividade e dossiê**: Verificar criação de `IMPLANTAR/50-DOSSIE-PRODUCAO-STRIPE.md` e registrar handoff. `[CONCLUÍDO - OpenCode - 2026-04-06]`

---

## 🛡️ Proteção de Futuro (Previsão de Erros)

Para evitar que erros futuros ocorram sem aviso:

1. **Ratelimit Inteligente**: Implementar `@upstash/ratelimit` em rotas sensíveis de API (Pagamentos/Login).
2. **Audit Logs**: Salvar toda tentativa de login falha no banco para detectar Brute Force.
3. **Health Check Automático**: Script de `npm run gate` deve ser rodado obrigatóriamente em cada commit (Ordem de Antigravity).

---

_Última atualização: 2026-04-06 por Antigravity (Gemini 3 Pro)_
