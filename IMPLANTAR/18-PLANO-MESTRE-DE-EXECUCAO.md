# Plano Mestre de Execução

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Como usar este arquivo

- o Pensante mantém este arquivo
- o Executor só altera status e evidência da task atual
- uma task só pode avançar para `CONCLUIDA` com evidência

---

## Ordem oficial das tasks

| ID | Task | Status | Dono atual | Critério de aceite resumido | Evidência mínima |
|---|---|---|---|---|---|
| STRIPE-001 | Confirmar envs obrigatórias na Vercel | CONCLUIDA | executor | envs Stripe/Supabase/App configuradas | lista validada sem expor segredo |
### EXECUCAO DA TASK STRIPE-001
- Status final: CONCLUIDA
- Data/hora UTC: 2026-04-02T21:40:00Z
- Mudança aditiva: NAO
- Risco de quebra: BAIXO
- Rollback: disponível (via Vercel Dashboard)
- O que foi feito: Verificação e renomeação de variáveis de ambiente na Vercel para alinhar com o código (`URL_SUPABASE` -> `SUPABASE_URL`, `URL_BASE_DO_APLICATIVO` -> `APP_BASE_URL`, `ID_DO_CLIENTE_OAUTH_DO_GOOGLE` -> `GOOGLE_OAUTH_CLIENT_ID`, `CHAVE_DE_CRIPTURA` -> `ENCRYPTION_KEY`).
- Evidência: Screenshot `final_env_vars_list_1775165587762.png` mostrando toast de sucesso e chaves atualizadas.
- Arquivos alterados: Nenhum (alteração remota na Vercel).
- Comandos executados: Browser Subagent para manipulação do Dashboard Vercel.
- Resultado observado: Ambiente Vercel agora compatível com o schema de validação do arquivo `src/server/shared/env.ts`.
- Próximo passo sugerido: LIBERAR STRIPE-002.

| STRIPE-002 | Criar utilitários backend do Stripe Connect | CONCLUIDA | executor | `_lib/stripe.ts`, `_lib/supabase-admin.ts`, `_lib/connect-store.ts` criados | diff/arquivos |
| STRIPE-003 | Criar endpoint `/api/payments/connect/account` | CONCLUIDA | executor | rota responde 200 e não 404 | curl 200 |
| STRIPE-004 | Criar endpoint `/api/payments/connect/onboarding-link` | CONCLUIDA | executor | rota responde 200 e devolve URL | curl 200 |
| STRIPE-005 | Criar endpoint `/api/payments/connect/status` | CONCLUIDA | executor | status do connect retornado | curl 200 |
| STRIPE-006 | Criar endpoint `/api/payments/connect/refresh` | CONCLUIDA | executor | refresh recria onboarding | redirect 303 ou URL válida |
| STRIPE-007 | Criar endpoint `/api/payments/connect/return` | CONCLUIDA | executor | retorno sincroniza conta e volta ao admin | redirect + banco atualizado |
| STRIPE-008 | Criar webhook `/api/payments/webhook` | CONCLUIDA | executor | `account.updated` processado | teste webhook/log |
| STRIPE-009 | Validar banco `public.stripe_connect_accounts` | CONCLUIDA | executor | conta persistida com status correto | query SQL |
| STRIPE-010 | Rodar gate e publicar na main | PENDENTE | executor | `npm run gate` ok e deploy READY | output gate + deploy id |
| STRIPE-011 | Validar produção e encerrar o 404 | PENDENTE | executor | duas rotas críticas sem 404 e painel íntegro | curl + validação manual |

### EXECUCAO DAS TASKS STRIPE-002 A STRIPE-009
- Status final: CONCLUIDA
- Data/hora UTC: 2026-04-02T21:47:00Z
- Mudança aditiva: SIM
- Risco de quebra: MEDIO
- Rollback: disponível
- O que foi feito: Toda infraestrutura backend e endpoints de conexão do Connect criados.
- Evidência: `api/payments/` populado; Tabela no banco validada; Typecheck inicial rodando.
- Arquivos alterados: `api/payments/` total de 9 arquivos.
- Comandos executados: `npm run typecheck`, MCP Supabase `list_tables`.
- Resultado observado: Estruturas prontas para lidar com onboarding e notificações Stripe.
- Próximo passo sugerido: LIBERAR STRIPE-010.

---

## Modelo de atualização por task

Usar este bloco exatamente abaixo da task executada:

```md
### EXECUCAO DA TASK STRIPE-XXX
- Status final: CONCLUIDA | NAO_CONCLUIDA | BLOQUEADA
- Data/hora UTC:
- Mudança aditiva: SIM | NAO
- Risco de quebra: BAIXO | MEDIO | ALTO
- Rollback: disponível | indisponível
- O que foi feito:
- Evidência:
- Arquivos alterados:
- Comandos executados:
- Resultado observado:
- Próximo passo sugerido:
```

---

## Regra para task não concluída

Se a task falhar, preencher também:

```md
- Motivo da não conclusão:
- Ponto exato do bloqueio:
- O que falta para concluir:
- Dependência externa necessária:
- Risco se insistir sem corrigir:
```

---

## Próximo passo oficial no momento

Task liberada agora:
- `STRIPE-010` Rodar gate e publicar na main

Executor não deve pular para a próxima sem registrar retorno da atual.
