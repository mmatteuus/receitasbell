# Tarefas Pendentes: Receitas Bell

Este documento lista o que falta para estabilizar o sistema e entregar o projeto com qualidade.

> [!NOTE]
> **REGRAS PARA AGENTES:**
> - Ao assumir uma tarefa, adicione: `[EM EXECUÇÃO - Nome do Agente]`
> - Ao finalizar, mova para o arquivo `implantar/HISTORICO_CONCLUIDO.md` ou adicione `[X]` e aguarde revisão.

## 🔑 Autenticação e Gestão de Usuários
- [ ] **Erro "Organization not identified"**: Investigar e corrigir falha de identificação organizacional durante o login/signup em produção.
- [ ] **Fluxo de Recuperação de Senha**: Testar e garantir que o envio de e-mails para reset de senha (via Supabase) está enviando para o link correto.
- [ ] **Fluxo de Signup**: Validar criação de novos usuários administrativos e restrição por convite/domínio se aplicável.

## 💳 Pagamentos (Stripe)
- [ ] **Produtização**: Trocar as chaves de teste (`sk_test`, `pk_test`) pelas chaves de produção (`sk_live`, `pk_live`) após confirmação do usuário.
- [ ] **Validação Stripe Connect**: Realizar um ciclo completo de pagamento simulado/testado no ambiente de pré-produção ou real se aplicável.

## 🧹 Limpeza e Organização
- [ ] **Limpeza de Pasta `implantar/`**: Deletar logs e playbooks antigos que já foram realizados (Tarefa em progresso por Antigravity).
- [ ] **Verificações de Segurança**: Rodar `npm run gate` final e validar se não há segredos expostos no código.

## 🏗️ Estabilidade Geral
- [ ] **Smoke Test Geral**: Navegar pelo site inteiro (Home, Categorias, Receitas, Admin) para garantir que nenhuma alteração de roteamento quebrou a navegação lateral.

---
*Última atualização: 2026-04-06 por Antigravity (Gemini 3 Flash)*
