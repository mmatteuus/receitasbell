# Tarefas Pendentes: Receitas Bell

Este documento lista o que falta para estabilizar o sistema e entregar o projeto com qualidade.

> [!NOTE]
> **REGRAS PARA AGENTES:**
>
> - Ao assumir uma tarefa, adicione: `[EM EXECUÇÃO - Nome do Agente]`
> - Ao finalizar, mova para o arquivo `implantar/HISTORICO_CONCLUIDO.md` ou adicione `[X]` e aguarde revisão.

## 🎯 Prioridades Estratégicas (Orquestração Antigravity)

### 🔥 P1: Estabilidade Financeira & Dados (Backend/Infra)
- [ ] **Auditoria de Webhooks Stripe**: **(ALTA PRIORIDADE)** Validar no Supabase se as transações estão sendo registradas. Se o webhook falhar, o usuário paga e não recebe o produto. `[EM EXECUÇÃO - Backend/Infra]`
- [ ] **Logs de Produção e Sentry**: Implementar monitoramento preventivo para capturar erros 500 antes que o usuário reporte.
- [ ] **Migração de Schema Final**: Garantir integridade total das tabelas de `tenants` e `receipts`.

### 🔑 P2: Fluxos de Autenticação Críticos (Front-End)
- [ ] **Recuperação de Senha**: Finalizar e polir o fluxo de "Esqueci minha senha" integrado ao Resend/Supabase Auth.
- [ ] **Validação de Convites Admin**: Garantir que apenas quem deve entrar, consiga se cadastrar.

### 🚀 P3: Produtização & SEO (Handoff Final)
- [ ] **Migração para Chaves LIVE (Stripe)**: O último passo antes do lançamento público. **(Exclusivo Antigravity)**
- [ ] **Refinamento SEO & Meta Tags**: Títulos únicos e amigáveis para indexação do PWA no Google.
- [ ] **Instalação PWA**: Reforçar a sinalização de "Adicionar à tela inicial" no painel.

---

## 🛡️ Proteção de Futuro (Previsão de Erros)
Para evitar que erros futuros ocorram sem aviso:
1. **Ratelimit Inteligente**: Implementar `@upstash/ratelimit` em rotas sensíveis de API (Pagamentos/Login).
2. **Audit Logs**: Salvar toda tentativa de login falha no banco para detectar Brute Force.
3. **Health Check Automático**: Script de `npm run gate` deve ser rodado obrigatóriamente em cada commit (Ordem de Antigravity).

---

_Última atualização: 2026-04-06 por Antigravity (Gemini 3 Pro)_
