# Tarefas Pendentes: Receitas Bell

Este documento lista o que falta para estabilizar o sistema e entregar o projeto com qualidade.

> [!NOTE]
> **REGRAS PARA AGENTES:**
>
> - Ao assumir uma tarefa, adicione: `[EM EXECUÇÃO - Nome do Agente]`
> - Ao finalizar, mova para o arquivo `implantar/HISTORICO_CONCLUIDO.md` ou adicione `[X]` e aguarde revisão.

## 🧭 Coordenação de Agentes

- [x] **Registro e atualização de contexto (OpenCode)**: Ler `CONTEXTO_AGERIAL.md`, conferir histórico e registrar atividade do agente. `[CONCLUÍDO - Claude Haiku 4.5 - 2026-04-06]`

## 🔑 Autenticação e Gestão de Usuários

- [x] **Erro "Organization not identified"**: Investigação + Implementação da Solução. `[INVESTIGAÇÃO + IMPLEMENTAÇÃO CONCLUÍDA - Claude Haiku 4.5 - 2026-04-06 - Gate: PASS]`
- [ ] **Limpeza Profunda `implantar/`**: Apagar os subdiretórios `ARQUIVADOS` e `archive` conforme solicitado pelo usuário. `[EM EXECUÇÃO - Antigravity - 2026-04-06]`
- [ ] **Fluxo de Recuperação de Senha**: Testar e garantir que o envio de e-mails para reset de senha (via Supabase) está enviando para o link correto.
- [ ] **Fluxo de Signup**: Validar criação de novos usuários administrativos e restrição por convite/domínio se aplicável.

## 💳 Pagamentos (Stripe)

- [ ] **Produtização**: Trocar as chaves de teste (`sk_test`, `pk_test`) pelas chaves de produção (`sk_live`, `pk_live`) após confirmação do usuário. **(Prioridade Antigravity)**
- [ ] **Validação Stripe Connect**: Realizar um ciclo completo de pagamento simulado/testado no ambiente de pré-produção ou real se aplicável. **(Prioridade Antigravity)**

## 🏗️ Estabilidade Geral

- [ ] **Smoke Test Geral**: Navegar pelo site inteiro (Home, Categorias, Receitas, Admin) para garantir que nenhuma alteração de roteamento quebrou a navegação lateral.
- [ ] **Acompanhamento de Deploy**: Validar se o próximo push gera um deploy READY sem erros de função.

---

_Última atualização: 2026-04-06 por Antigravity (Gemini 3 Pro)_
