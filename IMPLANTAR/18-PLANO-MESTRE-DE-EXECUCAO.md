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
| STRIPE-001 | Confirmar envs obrigatórias na Vercel | LIBERADA | executor | envs Stripe/Supabase/App configuradas | lista validada sem expor segredo |
| STRIPE-002 | Criar utilitários backend do Stripe Connect | PENDENTE | executor | `_lib/stripe.ts`, `_lib/supabase-admin.ts`, `_lib/connect-store.ts` criados | diff/arquivos |
| STRIPE-003 | Criar endpoint `/api/payments/connect/account` | PENDENTE | executor | rota responde 200 e não 404 | curl 200 |
| STRIPE-004 | Criar endpoint `/api/payments/connect/onboarding-link` | PENDENTE | executor | rota responde 200 e devolve URL | curl 200 |
| STRIPE-005 | Criar endpoint `/api/payments/connect/status` | PENDENTE | executor | status do connect retornado | curl 200 |
| STRIPE-006 | Criar endpoint `/api/payments/connect/refresh` | PENDENTE | executor | refresh recria onboarding | redirect 303 ou URL válida |
| STRIPE-007 | Criar endpoint `/api/payments/connect/return` | PENDENTE | executor | retorno sincroniza conta e volta ao admin | redirect + banco atualizado |
| STRIPE-008 | Criar webhook `/api/payments/webhook` | PENDENTE | executor | `account.updated` processado | teste webhook/log |
| STRIPE-009 | Validar banco `public.stripe_connect_accounts` | PENDENTE | executor | conta persistida com status correto | query SQL |
| STRIPE-010 | Rodar gate e publicar na main | PENDENTE | executor | `npm run gate` ok e deploy READY | output gate + deploy id |
| STRIPE-011 | Validar produção e encerrar o 404 | PENDENTE | executor | duas rotas críticas sem 404 e painel íntegro | curl + validação manual |

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
- `STRIPE-001` Confirmar envs obrigatórias na Vercel

Executor não deve pular para a próxima sem registrar retorno da atual.
