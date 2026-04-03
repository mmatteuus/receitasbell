# 32-DOSSIE-STRIPE-CONNECT-BOTAO-NAO-FUNCIONA.md

## SOLICITAÇÃO AO AGENTE PENSANTE

> **Este documento foi gerado pelo Agente Executor.**
> Solicito ao Agente Pensante que elabore um plano de implementação completo e detalhado para
> corrigir o botão "Conectar com Stripe" no painel admin do ReceitasBell.
> Todos os erros observados, arquivos afetados, logs e contexto técnico estão documentados abaixo.

---

## 1. CONTEXTO GERAL

**Data do teste**: 2026-04-03 (19:08h horário de Brasília)
**Ambiente**: Produção — https://receitasbell.vercel.app
**Deploy ativo**: commit `b7a849b`
**Página afetada**: `/t/receitasbell/admin/pagamentos/configuracoes`

O botão **"Conectar com Stripe"** está visível na UI, mas ao clicar ele:
1. Exibe estado "Conectando..." por 1-2 segundos
2. Retorna ao estado inicial sem redirecionar para o Stripe
3. Nenhum link de onboarding é gerado

---

## 2. FLUXO DO BOTÃO (COMO FOI PROJETADO)

```
UI: clica em "Conectar com Stripe"
  └─► POST /api/payments/connect/onboarding-link
        ├─ Se já existe conta no banco → gera link do Stripe → redireciona
        └─ Se NÃO existe conta → retorna 404
              └─► UI tenta fallback: POST /api/payments/connect/account
                    ├─ Cria conta no Stripe (stripeClient.accounts.create)
                    ├─ Persiste no Supabase (stripe_connect_accounts)
                    └─ Gera link de onboarding → redireciona
```

---

## 3. ERROS OBSERVADOS EM PRODUÇÃO

### Evidência #1 — Logs do Vercel (observados nos runtime logs em 19:08h)

```
APR 03 19:08:30.40  POST  404  receitasb...  /api/payments/conn...
APR 03 19:08:30.92  POST  500  receitasb...  /api/payments/conn...
```

### Erro #1: POST `/api/payments/connect/onboarding-link` → **HTTP 404**

**Causa**: A tabela `stripe_connect_accounts` está **vazia** (confirmado via SQL abaixo).
Não existe nenhuma conta Stripe Connect cadastrada para o tenant `receitasbell`.

**Corpo da resposta retornado pelo handler** (`onboarding-link.ts`, linha 43-48):
```json
{
  "error": "Conta Stripe Connect não encontrada para este tenant. Crie a conta primeiro em /connect/account."
}
```

Este 404 é **comportamento correto do código** — não é bug de roteamento.
A UI deveria tratar isso e chamar `/connect/account` em seguida. Precisa verificar se faz isso.

### Erro #2: POST `/api/payments/connect/account` → **HTTP 500**

**Causa raiz identificada**: O Stripe retornou um erro de permissão ao tentar criar a conta.

**Mensagem exata do Stripe** (capturada nos logs da Vercel durante o teste):
```
"You can only create new accounts if you've signed up for Connect,
which you can do at https://dashboard.stripe.com/connect."
```

**Código do handler** (`account.ts`, linha 54-59) que dispara o erro:
```typescript
const account = await stripeClient.accounts.create({
  type: 'standard',
  metadata: {
    tenantId: tenant.id,
  },
});
```

Este código é correto, mas **o Stripe Connect não está ativado** na conta Stripe configurada
nas variáveis de ambiente do projeto.

---

## 4. DIAGNÓSTICO DO BANCO DE DADOS (SUPABASE)

**Tabela**: `stripe_connect_accounts`
**Projeto Supabase**: `ixfwvaszmngbyxrdiaha` (receitasbell, sa-east-1)

**Resultado da query**:
```sql
SELECT * FROM stripe_connect_accounts LIMIT 10;
-- Retornou: [] (array vazio)
```

**Schema da tabela** (confirma que está criada corretamente):
```
tenant_id                     uuid
stripe_account_id             text
status                        text
details_submitted             boolean
charges_enabled               boolean
payouts_enabled               boolean
requirements_currently_due_json   jsonb
requirements_eventually_due_json  jsonb
default_currency              text
disabled_reason               text
created_at                    timestamptz
updated_at                    timestamptz
```

**Conclusão**: A tabela existe e tem o schema correto, mas está **completamente vazia**.
Nenhuma conta Stripe Connect foi criada ainda pois todas as tentativas falharam com 500.

---

## 5. ANÁLISE DOS ARQUIVOS DE CÓDIGO

### `api/payments/[...path].ts` (handler catch-all)
- Localização: `d:\MATEUS\Documentos\GitHub\receitasbell\api\payments\[...path].ts`
- Delega tudo para `paymentsRouter`
- **Status**: OK

### `src/server/payments/router.ts` (roteador)
- Rota `connect/account` → `connectAccountHandler` ✅
- Rota `connect/onboarding-link` → `connectLinkHandler` ✅
- Rota `connect/status` → `connectStatusHandler` ✅
- **Parsing do path**: Usa `request.query.path` quando disponível, senão faz parse da URL
- **Status**: OK — roteamento funciona (confirmado pelo 404/500 chegarem ao handler)

### `src/server/payments/application/handlers/connect/account.ts`
- Verifica conta existente → se não existe, chama `stripeClient.accounts.create()`
- **Problema**: `stripeClient.accounts.create()` falha na conta Stripe atual porque
  o Stripe Connect **não está habilitado** nessa conta Stripe
- **Linha do erro**: 54

### `src/server/payments/application/handlers/connect/onboarding-link.ts`
- Busca conta no banco → se não encontra, retorna 404
- **Status**: OK — comportamento correto, mas a UI não está tratando o 404

### `src/server/payments/repo/accounts.ts`
- `getConnectAccountByTenantId` → SELECT correto
- `upsertConnectAccount` → UPSERT correto
- **Status**: OK

### `src/server/payments/providers/stripe/client.ts`
- Usa `STRIPE_SECRET_KEY` da env
- **Não verificado**: Precisa confirmar qual chave está configurada (test vs live)
  e se é a chave de uma conta com Connect ativado

---

## 6. VARIÁVEIS DE AMBIENTE SUSPEITAS

As seguintes variáveis precisam ser verificadas no Vercel:

| Variável | O que precisa | Status suspeito |
|----------|--------------|-----------------|
| `STRIPE_SECRET_KEY` | Chave de conta com Connect ativado | ⚠️ Provavelmente test key sem Connect |
| `STRIPE_WEBHOOK_SECRET` | Webhook configurado | Não testado |
| `APP_BASE_URL` | URL base para redirect_url/return_url | Precisa ser `https://receitasbell.vercel.app` |

---

## 7. EVIDÊNCIAS VISUAIS

Os logs da Vercel capturados durante o teste estão em:
```
C:\Users\MATEUS\.gemini\antigravity\brain\6c150401-2e4f-4e26-a8bc-e5534aba7e4b\
  .system_generated\click_feedback\click_feedback_1775254169025.png
```

Mostra:
- `POST 500 /api/payments/conn...` (connect/account)
- `POST 404 /api/payments/conn...` (connect/onboarding-link)

---

## 8. O QUE FOI CORRIGIDO NESTA SESSÃO (E NÃO RESOLVEU O PROBLEMA)

Na sessão anterior, foi corrigido o **roteamento da Vercel** (erro 404 por ausência de rewrite):

```json
// Adicionado ao vercel.json (commit b7a849b):
{ "source": "/api/payments/:path*", "destination": "/api/payments/[...path]" }
```

Esta correção foi necessária mas **insuficiente**. As rotas chegam ao handler, mas o próprio
handler falha por razão externa: o Stripe Connect não está ativado na conta.

---

## 9. CAUSA RAIZ DEFINITIVA

> **O Stripe Connect (plataforma) não está ativado na conta Stripe configurada
> nas variáveis de ambiente de produção.**

Para criar contas conectadas (`stripeClient.accounts.create()`), a conta Stripe principal
precisa ter o recurso "Connect" ativado em:
https://dashboard.stripe.com/connect/accounts/overview

Sem isso, toda tentativa de criar uma conta conectada retorna o erro 500 visto em produção.

---

## 10. POSSÍVEIS CENÁRIOS E SOLUÇÕES

### Cenário A — Conta Stripe sem Connect ativado (mais provável)
**Ação**: Acessar o Stripe Dashboard > Connect > Ativar plataforma > Preencher cadastro

### Cenário B — Usando chave de teste Stripe que não suporta Connect em modo live
**Ação**: Verificar se `STRIPE_SECRET_KEY` é `sk_test_...` ou `sk_live_...`
e se o Connect está ativado no modo correspondente

### Cenário C — Conta Stripe diferente da que tem Connect ativado
**Ação**: Substituir `STRIPE_SECRET_KEY` nas env vars do Vercel pela chave correta

### Cenário D — Problema no fluxo da UI (fallback não implementado)
**Ação**: Verificar o componente que chama `/api/payments/connect/onboarding-link`
e confirmar que, ao receber 404, ele chama `/api/payments/connect/account` em seguida.
Se não faz isso, precisa ser implementado.

---

## 11. ARQUIVOS A INVESTIGAR PELO AGENTE PENSANTE

```
# Backend:
src/server/payments/providers/stripe/client.ts   ← como o cliente Stripe é inicializado
src/server/payments/application/handlers/connect/account.ts   ← handler de criação (linha 54)
src/server/payments/application/handlers/connect/onboarding-link.ts   ← handler de link

# Frontend:
src/components/admin/StripeConnect*.tsx   ← componente que chama os endpoints
src/pages/admin/pagamentos/configuracoes*.tsx   ← página de configurações

# Infraestrutura:
vercel.json   ← env vars relevantes (STRIPE_SECRET_KEY, APP_BASE_URL)
```

---

## 12. PEDIDO AO AGENTE PENSANTE

Solicito que o Agente Pensante:

1. **Elabore um plano de ação priorizado** para corrigir o botão "Conectar com Stripe"
2. **Identifique qual Cenário** (A, B, C ou D da seção 10) é o mais provável
3. **Verifique o componente de UI** que dispara o botão e confirme se o fallback
   `account → onboarding-link` está implementado corretamente
4. **Verifique o `STRIPE_SECRET_KEY`** configurado no Vercel (sem expor o valor)
   apenas para confirmar se corresponde à conta que tem Connect ativado
5. **Defina o menor delta possível** para que o botão funcione end-to-end
6. **Documente o plano** em `IMPLANTAR/CAIXA-DE-ENTRADA.md` como instrução para o Executor

---

## 13. ESTADO ATUAL DO SISTEMA

| Componente | Status |
|-----------|--------|
| Roteamento Vercel (`vercel.json`) | ✅ Correto (fix b7a849b) |
| Handler catch-all (`api/payments/[...path].ts`) | ✅ Funcional |
| Router payments (`src/server/payments/router.ts`) | ✅ Funcional |
| Tabela `stripe_connect_accounts` (Supabase) | ✅ Existe, mas vazia |
| Handler `connect/account` | ✅ Código correto, mas bloqueado pelo Stripe |
| Handler `connect/onboarding-link` | ✅ Código correto |
| **Stripe Connect na conta configurada** | ❌ **NÃO ATIVADO** |
| Botão "Conectar com Stripe" UI | ❌ **NÃO FUNCIONA** |

---

*Documento gerado pelo Agente Executor em 2026-04-03T22:15h*
*Referência: PASSO 7 — Stripe Connect 404 corrigido em `STATUS-EXECUCAO.md`*
*Próximo responsável: Agente Pensante*
