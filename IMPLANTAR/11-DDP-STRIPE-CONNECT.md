# DDP — Documento de Desenvolvimento e Deploy do Stripe Connect

Projeto: `mmatteuus/receitasbell`  
Branch: `main`  
Pasta oficial de repasse: `IMPLANTAR/`  
Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

---

## F0 — Kickoff

### FATO
- produção atual na Vercel está ativa
- admin já autentica
- frontend chama duas rotas inexistentes e recebe `404`
- Vercel usa `framework: vite`
- Vercel usa `buildCommand: npm run gate`
- o projeto declara integração com Stripe e Supabase no `package.json` e `README`
- existe a tabela `public.stripe_connect_accounts` no Supabase
- existe a conta Stripe `acct_1T4JaqCXD5Lwt8YN`

### SUPOSIÇÃO
- a implementação de funções serverless do projeto usa arquivos em `/api/**.ts`
- o painel admin já possui botão/ação para iniciar conexão Stripe
- o tenant ativo do admin é `receitasbell`

### [PENDENTE]
- confirmar no código qual arquivo frontend chama os dois endpoints 404 para apontar a tela de sucesso/erro com exatidão

---

## F1 — Checklist aplicado

| Item | Status | Evidência | Impacto | Ação |
|---|---|---|---|---|
| Vercel em produção | OK | deploy READY | app acessível | manter |
| Build gate definido | OK | `npm run gate` | segurança de release | manter |
| Admin login funcional | OK | estado informado pelo usuário | base estável | não tocar auth |
| Stripe Connect account table existe | OK | Supabase `public.stripe_connect_accounts` | persistência possível | usar |
| Endpoint `/api/payments/connect/account` | NOK | 404 em produção | bloqueia onboarding | criar |
| Endpoint `/api/payments/connect/onboarding-link` | NOK | 404 em produção | bloqueia onboarding | criar |
| Endpoint de status | NOVO | não evidenciado | UI sem estado confiável | criar |
| Webhook `account.updated` | NOVO | não evidenciado | estado fica desatualizado | criar |
| Persistência Stripe Connect | NOK | tabela existe, fluxo não evidenciado | perda de estado | implementar |
| ENV Stripe mapeada | NOVO | não documentada no handoff atual | risco de setup errado | documentar |
| Refresh URL onboarding | NOVO | não documentada | onboarding quebra ao expirar link | implementar |
| Return URL onboarding | NOVO | não documentada | retorno sem sincronização | implementar |
| Rollback de mudanças | NOVO | não consolidado | risco operacional | documentar |
| Protocolo de não-quebra | OK | mudança aditiva proposta | baixo risco | manter |
| Segredos no repositório | N/A | não serão gravados | segurança | manter fora do git |

---

## F2 — Scanner operacional

Arquivos e artefatos relevantes já confirmados:
- `package.json`
- `README.md`
- `vercel.json`
- Vercel project metadata
- Supabase tables
- Stripe account info

Não alterar neste passo:
- autenticação admin
- rotas antigas de pagamento
- domínio
- configurações de CSP e headers já existentes

---

## F3 — Mapa do backend para este fluxo

### Fluxo crítico alvo
1. admin autenticado inicia conexão Stripe
2. backend cria ou busca conta Connect Express
3. backend salva `account_id` no banco
4. backend gera account link
5. frontend redireciona para Stripe
6. Stripe retorna para a aplicação
7. backend lê conta e persiste status
8. webhook `account.updated` mantém sincronização

### Dependências deste fluxo
- Stripe REST API
- Vercel serverless functions
- Supabase tabela `public.stripe_connect_accounts`

### PII e dados sensíveis
- `stripe_account_id`: não é segredo, mas é dado operacional interno
- chaves Stripe: segredos, não versionar
- webhook secret: segredo, não versionar

---

## F4 — Trilha escolhida

**TRILHA B — Evoluir existente**

Motivo: há produto rodando, admin funcional, integração parcial declarada, mas backend Stripe Connect está incompleto.

---

## F5 — Arquitetura e contratos

### Rotas a criar
- `POST /api/payments/connect/account`
- `POST /api/payments/connect/onboarding-link`
- `GET /api/payments/connect/status`
- `POST /api/payments/connect/refresh`
- `GET /api/payments/connect/return`
- `POST /api/payments/webhook`

### Contrato funcional mínimo

#### `POST /api/payments/connect/account`
Entrada:
```json
{
  "tenantId": "uuid",
  "email": "admin@dominio.com"
}
```
Saída:
```json
{
  "ok": true,
  "accountId": "acct_xxx",
  "created": true
}
```

#### `POST /api/payments/connect/onboarding-link`
Entrada:
```json
{
  "tenantId": "uuid",
  "accountId": "acct_xxx"
}
```
Saída:
```json
{
  "ok": true,
  "url": "https://connect.stripe.com/..."
}
```

#### `GET /api/payments/connect/status?tenantId=...`
Saída:
```json
{
  "ok": true,
  "tenantId": "uuid",
  "accountId": "acct_xxx",
  "chargesEnabled": false,
  "payoutsEnabled": false,
  "detailsSubmitted": false,
  "status": "pending"
}
```

### Status canônico
- `pending`
- `restricted`
- `active`
- `rejected`

Regra:
- se `charges_enabled=true` e `payouts_enabled=true` → `active`
- se `details_submitted=true` mas capabilities incompletas → `restricted`
- se `details_submitted=false` → `pending`
- se conta rejeitada/desabilitada → `rejected`

---

## F6 — Resiliência

### Timeouts
| Dependência | Timeout | Retry |
|---|---:|---:|
| Stripe API | 10000ms | 2 |
| Supabase write | 5000ms | 0 |
| Supabase read | 5000ms | 0 |

### Retry
- usar backoff exponencial com jitter apenas nas chamadas Stripe
- não fazer retry em escrita de banco
- não fazer retry infinito

### Idempotência
- criação de conta deve usar persistência por tenant para não criar múltiplas contas Express desnecessárias
- se já existir `stripe_account_id` para o tenant, reutilizar

---

## F7 — Observabilidade e testes

### Logs obrigatórios
Campos mínimos por request Stripe Connect:
- `route`
- `tenant_id`
- `stripe_account_id`
- `request_id`
- `status_code`
- `duration_ms`
- `error_code` quando existir

### Testes mínimos
1. `POST /api/payments/connect/account` retorna 200
2. segunda chamada reutiliza conta existente
3. `POST /api/payments/connect/onboarding-link` retorna URL
4. `GET /api/payments/connect/status` reflete banco
5. webhook atualiza tabela

### Smoke em produção
- curl do endpoint account
- curl do endpoint onboarding-link
- abrir fluxo real pelo painel

---

## F8 — Runbook resumido

### Deploy
1. implementar arquivos
2. commit na `main`
3. aguardar Vercel `READY`
4. validar com curl
5. validar no painel admin

### Rollback
- reverter commit do Stripe Connect
- redeploy automático da Vercel
- conferir retorno ao estado anterior

---

## F9 — Ordem exata de execução

1. criar utilitário compartilhado Stripe
2. criar utilitário compartilhado Supabase admin
3. criar endpoint `account`
4. criar endpoint `onboarding-link`
5. criar endpoint `status`
6. criar endpoint `refresh`
7. criar endpoint `return`
8. criar endpoint `webhook`
9. validar local
10. commit na `main`
11. validar produção

### Critério de aceite global
- nenhum endpoint retorna 404
- onboarding abre no Stripe
- retorno atualiza status
- webhook mantém sincronização
- painel admin continua funcionando
