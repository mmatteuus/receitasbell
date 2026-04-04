# 45 — Dossiê de auditoria do repositório e correções

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

Projeto: Receitas Bell  
Repositório: `mmatteuus/receitasbell`  
Branch auditada: `main`

---

## 1. Checklist roadmap aplicado

### F0 — Kickoff
- escopo auditado: repositório, Vercel, CI, env, auth, HTTP/shared, Supabase e Stripe
- objetivo: localizar erros e falhas estruturais, priorizar por impacto e definir correções executáveis
- risco principal atual: instabilidade de produção + falhas silenciosas de runtime/auth

### F1 — Checklist
- [x] `package.json` auditado
- [x] `vercel.json` auditado
- [x] `.env.example` auditado
- [x] `.github/workflows/ci.yml` auditado
- [x] `src/server/shared/env.ts` auditado
- [x] `src/server/shared/http.ts` auditado
- [x] `src/server/auth/sessions.ts` auditado
- [x] `src/server/integrations/supabase/client.ts` auditado
- [x] `src/server/payments/providers/stripe/client.ts` auditado
- [x] estado do projeto na Vercel auditado
- [ ] fluxo completo Stripe Connect provado fim-a-fim
- [ ] atualização canônica do quadro `38` feita diretamente no próprio arquivo

### F2 — Scanner
Arquivos-base desta auditoria:
- `package.json`
- `vercel.json`
- `.env.example`
- `.github/workflows/ci.yml`
- `src/server/shared/env.ts`
- `src/server/shared/http.ts`
- `src/server/auth/sessions.ts`
- `src/server/integrations/supabase/client.ts`
- `src/server/payments/providers/stripe/client.ts`

### F3 — Mapa rápido
Módulos críticos encontrados:
- deploy e build Vercel
- auth e sessão
- HTTP/shared
- integração Supabase
- integração Stripe
- coordenação operacional em `IMPLANTAR/`

### F4 — Trilha escolhida
**TRILHA B — evoluir e estabilizar o backend/frontend existente sem redesenho de stack.**

---

## 2. Snapshot do backend

### FATO
- O build de produção na Vercel roda `npm run gate`, isto é, `lint + typecheck + build + test:unit`. fileciteturn84file0
- O projeto expõe hardening importante em `vercel.json` com HSTS, CSP, `X-Frame-Options`, `Permissions-Policy` e `Cache-Control: no-store` para rotas sensíveis. fileciteturn85file0
- O CI usa GitHub Actions fixadas por SHA, o que está alinhado com a política de segurança do projeto. fileciteturn90file0
- O cliente admin do Supabase falha imediatamente se `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` estiverem ausentes. fileciteturn100file0
- O cliente Stripe falha imediatamente se `STRIPE_SECRET_KEY` estiver ausente. fileciteturn99file0
- O sistema de sessão tem fallback para cookie stateless se a gravação em `auth_sessions` falhar. fileciteturn95file0
- `validateCriticalEnv()` não exige `SUPABASE_SERVICE_ROLE_KEY` nem `STRIPE_SECRET_KEY`, apesar de módulos críticos dependerem deles para subir. fileciteturn93file0 fileciteturn100file0 fileciteturn99file0

### SUPOSIÇÃO
- A produção atual está funcional apenas de forma parcial/instável, porque o projeto da Vercel mostra produção recente em erro e sem `live` ativo no metadata atual, apesar de haver deploys `READY` recentes e um novo deploy em andamento.

### [PENDENTE]
- confirmar o resultado final do deploy `dpl_F1h7619B53qgDzd4oRTdGv5Lgq8v`
- confirmar quais envs de produção estão ausentes ou divergentes
- provar fluxo autenticado de Stripe Connect com navegador + banco + backend

---

## 3. Trilha escolhida

**TRILHA B — corrigir falhas reais do repositório existente e estabilizar deploy/runtime sem mudar stack.**

Justificativa:
- há estrutura madura de CI, Vercel, Supabase e Stripe
- os principais problemas são de estabilidade, validação de env, sessão e operação
- o ganho maior vem de endurecimento e correções cirúrgicas

---

## 4. Top 3 fluxos críticos

### Fluxo 1 — Deploy de produção
`push main` -> CI -> Vercel build (`npm run gate`) -> deploy `READY`/`ERROR`

### Fluxo 2 — Sessão admin
login -> criação de sessão -> leitura de cookie -> autorização admin

### Fluxo 3 — Stripe Connect
admin autenticado -> criação/recuperação de conta -> onboarding -> status -> persistência

---

## 5. Achados priorizados P0–P3

### P0 — validação de env crítica está incompleta
**Evidência**:
- `validateCriticalEnv()` exige `APP_BASE_URL`, `ADMIN_API_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_COOKIE_SECRET`, `ENCRYPTION_KEY`, mas não exige `SUPABASE_SERVICE_ROLE_KEY` nem `STRIPE_SECRET_KEY`. fileciteturn93file0
- o cliente admin do Supabase lança erro se `SUPABASE_SERVICE_ROLE_KEY` estiver ausente. fileciteturn100file0
- o cliente Stripe lança erro se `STRIPE_SECRET_KEY` estiver ausente. fileciteturn99file0

**Impacto**:
- a aplicação pode passar por partes da inicialização/validação e falhar só em runtime
- ambiente mal configurado vira erro tardio e difícil de diagnosticar
- produção pode quebrar em handlers críticos

**Correção passo a passo**:
1. incluir `SUPABASE_SERVICE_ROLE_KEY` em `validateCriticalEnv()`
2. incluir `STRIPE_SECRET_KEY` em `validateCriticalEnv()` para ambientes que usam payments
3. considerar `CRON_SECRET` obrigatório em produção se `crons` estiverem ativos
4. diferenciar env crítico global vs env crítico por feature

**Como testar**:
- rodar inicialização sem essas envs e verificar falha explícita na camada de validação
- rodar com todas as envs e verificar boot normal

**Risco de rollout**:
- baixo a médio, pois pode expor misconfigurações hoje ocultas

---

### P0 — produção na Vercel está instável
**Evidência**:
- metadata do projeto aponta `live: false` e `latestDeployment.readyState = ERROR` no momento da inspeção
- a lista de deploys mostra produção recente em `ERROR`, outra em `BUILDING` e vários `READY` anteriores

**Impacto**:
- risco real de indisponibilidade ou de produção sem estado canônico claro
- conflito entre o que a documentação operacional diz e o que a Vercel realmente mostra

**Correção passo a passo**:
1. tratar a Vercel como fonte de verdade, não a `IMPLANTAR/`
2. aguardar/validar o resultado do deploy `dpl_F1h7619B53qgDzd4oRTdGv5Lgq8v`
3. se falhar, registrar a causa exata do build/deploy
4. se passar, atualizar imediatamente a documentação operacional
5. manter um rollback candidate conhecido e documentado

**Como testar**:
- verificar estado final do deploy mais recente
- validar domínio ativo
- smoke em `/api/health`, auth admin e rotas de payments

**Risco de rollout**:
- alto, porque afeta produção diretamente

---

### P1 — fallback para sessão stateless mascara falha do banco e reduz controle operacional
**Evidência**:
- `createSession()` tenta gravar em `auth_sessions`; se falhar, registra aviso/erro e cai para cookie stateless assinado. fileciteturn95file0

**Impacto**:
- falha de persistência de sessão pode passar despercebida
- revogação e auditoria ficam inconsistentes
- incidentes em Supabase podem parecer “meio funcionando”

**Correção passo a passo**:
1. tornar o fallback configurável por feature flag/env
2. em produção, preferir falhar fechado para sessão administrativa
3. registrar métrica/alerta explícito quando houver fallback
4. separar comportamento para sessão de usuário final vs admin

**Como testar**:
- simular falha no insert de `auth_sessions`
- verificar se sessão admin falha de forma explícita em produção
- verificar se alertas/logs estruturados são emitidos

**Risco de rollout**:
- médio

---

### P1 — limpeza de cookie em produção pode ficar inconsistente com cookie `__Host-`
**Evidência**:
- o nome do cookie em produção é `__Host-rb_session`. fileciteturn95file0
- `setCookie()` envia `Secure` em produção. fileciteturn95file0
- `clearCookie()` não replica `Secure`. fileciteturn95file0

**Impacto**:
- logout/limpeza de sessão pode falhar em alguns cenários de browser/proxy
- comportamento pode ser inconsistente entre ambientes

**Correção passo a passo**:
1. alinhar `clearCookie()` com os mesmos atributos relevantes do `setCookie()`
2. manter `Path=/`, `HttpOnly`, `SameSite=Lax` e `Secure` em produção
3. validar logout em produção real

**Como testar**:
- login e logout em produção/preview
- inspeção do cookie no navegador
- verificar remoção efetiva do cookie

**Risco de rollout**:
- baixo

---

### P1 — `readJsonBody()` engole JSON inválido e devolve `{}`
**Evidência**:
- quando `req.body` é string inválida ou stream inválido, a função retorna `{}` em vez de erro explícito. fileciteturn94file0

**Impacto**:
- payload malformado pode virar requisição aparentemente vazia
- dificulta diagnóstico e pode mascarar cliente quebrado
- aumenta risco de comportamento silencioso em rotas mutáveis

**Correção passo a passo**:
1. retornar `ApiError(400, 'Invalid JSON body')` quando parsing falhar
2. aplicar esse comportamento em rotas que exigem JSON válido
3. manter fallback vazio só para endpoints explicitamente tolerantes

**Como testar**:
- enviar body inválido
- esperar 400 com `application/problem+json`

**Risco de rollout**:
- médio, pois clientes hoje dependentes de comportamento leniente podem quebrar

---

### P2 — `requireCronAuth()` aceita segredo por query string
**Evidência**:
- além do header `Authorization`, a função aceita `secret` na query string. fileciteturn94file0

**Impacto**:
- segredo pode aparecer em logs, histórico, traces e URLs compartilhadas
- reduz hardening do fluxo de cron

**Correção passo a passo**:
1. descontinuar autenticação por query string em produção
2. aceitar query apenas atrás de feature flag de dev/local
3. documentar que cron usa `Authorization`

**Como testar**:
- chamada com query em produção deve falhar
- chamada com bearer válido deve passar

**Risco de rollout**:
- baixo a médio

---

### P2 — `.env.example` não reflete completamente o que o runtime crítico realmente exige
**Evidência**:
- há placeholders, mas a validação crítica do código e os módulos que falham em runtime não estão totalmente alinhados entre si. fileciteturn88file0 fileciteturn93file0 fileciteturn100file0 fileciteturn99file0

**Impacto**:
- onboarding de ambiente fica confuso
- aumenta chance de deploy quebrado por config incompleta

**Correção passo a passo**:
1. alinhar `.env.example` com `validateCriticalEnv()`
2. separar variáveis obrigatórias por domínio: core, auth, payments, observability, cron
3. documentar quais são obrigatórias em produção e quais são opcionais por feature

**Como testar**:
- checklist de env sem ambiguidades
- boot de ambiente limpo com docs atualizadas

**Risco de rollout**:
- baixo

---

### P3 — barramento operacional da `IMPLANTAR/` ainda depende de complemento temporário
**Evidência**:
- o `38` ficou como quadro base e o `44` foi necessário como complemento canônico temporário por limitação do conector de edição

**Impacto**:
- a operação funciona, mas ainda tem custo cognitivo maior do que o ideal

**Correção passo a passo**:
1. fundir `44` em `38` quando a edição direta estiver disponível
2. marcar `44` como `SUPERADO`
3. manter um único quadro canônico

**Como testar**:
- agentes operam só a partir de um quadro

**Risco de rollout**:
- baixo

---

## 6. Arquitetura e contratos propostos

### Regras propostas
- validar env crítica antes de runtime de handlers sensíveis
- falhar fechado para sessão admin quando persistência de sessão estiver indisponível
- rejeitar JSON inválido com 400 explícito
- não aceitar segredo de cron por query em produção
- alinhar limpeza de cookie com atributos do cookie de produção

### Contratos que precisam ficar claros
- sessão admin: comportamento com Supabase indisponível
- JSON body: erro explícito vs fallback vazio
- cron auth: header obrigatório em produção
- Stripe: env obrigatória antes do primeiro handler

---

## 7. Plano de implementação por fases

### Fase 1 — endurecimento de runtime
1. corrigir `validateCriticalEnv()`
2. endurecer `readJsonBody()`
3. remover query secret em produção de `requireCronAuth()`

### Fase 2 — auth e sessão
1. alinhar `clearCookie()`
2. decidir política de fallback stateless para sessão admin
3. adicionar logs/métricas para fallback de sessão

### Fase 3 — operação e deploy
1. validar resultado do deploy atual na Vercel
2. sincronizar `IMPLANTAR/` com o estado real
3. manter rollback candidate documentado

### Fase 4 — documentação e barramento
1. alinhar `.env.example`
2. fundir `44` em `38`
3. arquivar complementos temporários superados

---

## 8. Observabilidade, testes e CI/CD

### Pontos positivos
- CI usa actions pinadas por SHA. fileciteturn90file0
- build gate inclui lint, typecheck, build e unit tests. fileciteturn84file0
- Vercel aplica headers de hardening relevantes. fileciteturn85file0

### Melhorias obrigatórias
- alerta para fallback de sessão
- smoke pós-deploy de auth + payments
- validação explícita de env crítica antes de handlers de produção

### Gates sugeridos
- teste unitário para `readJsonBody()` com JSON inválido
- teste unitário para `clearCookie()` em produção
- teste unitário para `validateCriticalEnv()` cobrindo service role e Stripe
- smoke pós-deploy para `/api/health`, `/api/admin/auth/session`, `/api/payments/connect/status`

---

## 9. Runbooks e operação

### Runbook A — produção Vercel inconsistente
1. ler o deploy mais recente
2. confirmar se está `READY`, `ERROR` ou `BUILDING`
3. se `ERROR`, capturar a causa e comparar com rollback candidate recente
4. registrar estado real no barramento operacional

### Runbook B — sessão admin instável
1. verificar Supabase admin
2. verificar se houve fallback stateless
3. avaliar se a política deve falhar fechado

### Runbook C — Stripe quebrando em runtime
1. verificar `STRIPE_SECRET_KEY`
2. validar boot do cliente Stripe
3. validar rotas Connect/Checkout
4. cruzar com persistência local

---

## 10. Artefatos gerados ou exigidos

### Gerado nesta rodada
- este dossiê

### Exigidos em seguida
- correção de `validateCriticalEnv()`
- correção de `clearCookie()`
- endurecimento de `readJsonBody()`
- decisão formal sobre fallback de sessão admin
- validação do deploy Vercel mais recente

---

## 11. Suposições e [PENDENTE]

### FATO
- há falhas estruturais reais de validação/env, sessão e parsing HTTP
- a Vercel está com estado recente inconsistente entre `ERROR`, `BUILDING` e `READY`

### SUPOSIÇÃO
- a maior parte do risco atual é operacional/configuracional, não de arquitetura base

### [PENDENTE]
- causa exata do último deploy em `ERROR`
- status final do deploy atualmente em `BUILDING`
- prova fim-a-fim do Stripe Connect em produção

---

## 12. Previsão de falhas futuras

### Horizonte de 3 meses
- regressões de deploy por desalinhamento front/back
- sessões “meio funcionando” durante falha do banco
- erros silenciosos por JSON inválido aceito como `{}`

### Horizonte de 1 ano
- crescimento de dívida operacional em envs e barramento documental
- incidentes de auth difíceis de rastrear por fallback leniente
- falhas de integração Stripe por config parcial em ambiente novo

### Horizonte de 3 anos
- acúmulo de contratos implícitos entre frontend/backend sem validação robusta
- complexidade operacional maior que o necessário por documentação paralela
- maior custo de incident response em produção por falta de gates específicos de domínio

---

## 13. Handoff final para o executor

### Ordem exata
1. corrigir `validateCriticalEnv()` para incluir `SUPABASE_SERVICE_ROLE_KEY` e política para `STRIPE_SECRET_KEY`
2. corrigir `clearCookie()` para refletir atributos de produção
3. endurecer `readJsonBody()` para erro 400 em JSON inválido
4. revisar `requireCronAuth()` e remover query secret em produção
5. decidir política de fallback stateless para sessão admin
6. validar o deploy Vercel mais recente
7. sincronizar o barramento `IMPLANTAR/` com o estado real
8. provar Stripe Connect fim-a-fim

### Critério de aceite
- env crítica falha cedo e claramente
- logout limpa cookie corretamente em produção
- JSON inválido retorna 400 explícito
- cron não aceita segredo por query em produção
- sessão admin não mascara indisponibilidade crítica do banco
- produção Vercel tem estado canônico claro

### Protocolo de não quebra
- mudança mínima por vez
- testes antes de deploy
- rollback simples
- sem abrir múltiplas frentes críticas ao mesmo tempo
