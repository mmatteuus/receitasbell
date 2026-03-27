# PRD — Consolidação de Produção do ReceitasBell

Status do baseline: leitura do repositório em 2026-03-25.

## 1. Objetivo

Levar o projeto do estado atual:

"funciona nas partes centrais, mas ainda mistura fluxo oficial com legado, validação parcial e comportamento operacional disperso"

para:

"produção robusta, limpa, previsível, auditável e segura"

## 2. Objetivos principais

### Objetivo A — saneamento estrutural
- Eliminar código legado, rotas paralelas e imports mortos que hoje poluem build, tooling e manutenção.

### Objetivo B — gate real de deploy
- Garantir que produção só suba quando o gate oficial estiver refletido no deploy real da Vercel, e não apenas no repositório.

### Objetivo C — fechamento do módulo de pagamentos multi-tenant
- Fechar as lacunas restantes para declarar o fluxo Mercado Pago multi-tenant como operacionalmente pronto para produção.

## 3. Escopo

### Inclui
- Limpeza de código legado e caminhos quebrados.
- Consolidação das rotas oficiais de auth admin, OAuth, checkout, webhook e reconcile.
- Correção e validação do pipeline real da Vercel.
- Fechamento operacional do módulo Mercado Pago multi-tenant.
- Hardening básico de borda.
- Documentação operacional e de ownership do fluxo oficial.

### Não inclui
- Redesign total do frontend.
- Reescrita da stack.
- Split marketplace.
- Múltiplas contas simultâneas ativas por tenant.

## 4. Diagnóstico de origem

### Problema-raiz 1
- O projeto foi refatorado por camadas, mas partes antigas permaneceram acessíveis ou referenciadas.

### Problema-raiz 2
- O pipeline declarado no repositório e o comportamento observado no deploy ainda podem divergir por override de projeto ou configuração de dashboard.

### Problema-raiz 3
- O módulo Mercado Pago está sólido no núcleo, mas precisa de consolidação final para ficar claramente "production-grade".

## 5. Estado observado no repositório em 2026-03-25

### Já refletido no código
- `expires_at` e refresh preventivo estão presentes em `src/server/integrations/mercadopago/connections.ts`.
- Eventos `mercadopago.refresh_success` e `mercadopago.refresh_failed` já existem.
- `payment_mode` efetivo já influencia `sandbox_init_point` vs `init_point` no backend de checkout.
- Há testes unitários cobrindo OAuth state, conexões, webhook, reconcile e parte do readiness/admin.
- `vercel.json` já contém `Strict-Transport-Security`, `Permissions-Policy` e CSP em `Report-Only`.

### Parcial ou ainda ambíguo
- O CI executa `lint`, `typecheck`, `build`, `test:unit` e smoke; o `buildCommand` da Vercel no repositório executa `npm ci && npm run typecheck && npm run build && npm run test:unit`, sem `lint`.
- Ainda falta confirmar se o projeto Vercel real respeita esse `buildCommand` ou se existe override em dashboard.
- Ainda existe pelo menos um caminho paralelo de checkout em `/api/payments/mercadopago/create-preference`, enquanto o frontend público já usa `/api/checkout`.
- O repositório ainda mantém conteúdo em `src/_legacy/` e `tests/_legacy/`, o que é útil para rastreabilidade, mas aumenta ambiguidade até a limpeza final.

### Fluxo oficial alvo
- Auth admin: `api/admin/auth/*` com suporte de `src/server/admin/auth.ts` e `src/server/auth/*`.
- OAuth Mercado Pago: `api/admin/mercadopago/connect.ts` + `api/checkout/callback.ts` + `src/server/integrations/mercadopago/oauth.ts`.
- Conexões Mercado Pago: `src/server/integrations/mercadopago/connections.ts`.
- Checkout: `api/checkout/create.ts` + `src/server/payments/service.ts`.
- Webhook: `api/checkout/webhook.ts`.
- Reconcile: `api/jobs/reconcile.ts`.

## 6. Requisitos funcionais

### RF-01 — uma única rota oficial por fluxo
- Cada fluxo deve ter um único caminho oficial e documentado.
- Rotas paralelas devem ser removidas, reescritas como alias temporário controlado ou explicitamente marcadas como legado.

### RF-02 — uma única conexão ativa por tenant
- O sistema deve manter somente uma conexão ativa por tenant.
- Conexões antigas devem ir para histórico ou `disconnected`, sem ambiguidade operacional.

### RF-03 — deploy deve validar typecheck e testes
- Produção não pode subir sem passar no gate mínimo oficial.
- O gate mínimo oficial deve ser o mesmo em CI, `vercel.json`, documentação operacional e projeto Vercel real.

### RF-04 — sandbox/production deve alterar runtime real
- `payment_mode` precisa alterar de forma efetiva a URL de checkout e a política de validação da conexão.

### RF-05 — refresh automático
- O sistema deve tentar renovar token antes de exigir reconnect.
- Só deve cair para `reconnect_required` quando o refresh e o retry operacional falharem.

### RF-06 — rastreabilidade operacional
- Eventos críticos de conexão, refresh, webhook, checkout e reparo precisam ser rastreáveis por tenant.

## 7. Requisitos não funcionais

### RNF-01 — legibilidade para agente IA
- O repositório precisa ser navegável por automação sem tropeçar em caminhos mortos, imports extintos ou rotas concorrentes.

### RNF-02 — auditabilidade
- Eventos críticos de conexão e pagamento devem ser rastreáveis por logs estruturados e auditoria.

### RNF-03 — previsibilidade operacional
- O que está em `vercel.json`, CI e docs deve refletir o comportamento real em produção.

### RNF-04 — baixo atrito de manutenção
- Um desenvolvedor novo deve localizar o fluxo oficial de pagamentos sem precisar adivinhar qual arquivo ainda vale.

## 8. Plano de execução

### Fase 1 — limpeza de legado quebrado

Objetivo:
- Eliminar arquivos, imports e rotas que já não pertencem ao fluxo oficial.

Tarefas:
- Inventariar os arquivos citados em logs de build/deploy da Vercel.
- Classificar cada arquivo em `oficial`, `legado controlado` ou `morto`.
- Remover rotas e handlers antigos de Mercado Pago que não participam mais do fluxo oficial.
- Remover auth/admin antiga que dependa de exports inexistentes.
- Remover imports para módulos já extintos.
- Reduzir ou eliminar o uso de caminhos paralelos como `/api/payments/mercadopago/create-preference` se `/api/checkout` for o fluxo definitivo.
- Formalizar a política de remoção do conteúdo em `src/_legacy/`.

Critério de aceite:
- O repositório não contém mais rotas/API quebradas apontando para exports mortos.
- Cada responsabilidade crítica tem um único caminho oficial identificável.

### Fase 2 — corrigir o pipeline real da Vercel

Objetivo:
- Fazer o deploy validar o que o repositório declara como gate oficial.

Tarefas:
- Verificar por que a Vercel estaria rodando apenas `npm run build` quando o repositório declara um pipeline maior.
- Confirmar se existe override de Install/Build Command no dashboard do projeto.
- Definir o gate oficial mínimo para produção.
- Ajustar projeto Vercel para refletir o gate oficial.
- Fazer deploy de validação e confirmar nos logs a execução do gate completo.

Gate alvo para produção:
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`

Critério de aceite:
- O build real de produção executa o gate completo e falha em erro de lint, tipagem, build ou testes unitários.

### Fase 3 — consolidar o módulo Mercado Pago oficial

Objetivo:
- Eliminar caminhos paralelos e manter um único fluxo oficial de pagamentos.

Tarefas:
- Fixar os arquivos oficiais de OAuth, conexões, client, checkout create, webhook e reconcile.
- Remover ou isolar rotas antigas de Mercado Pago.
- Atualizar docs internas para refletir somente o fluxo oficial.
- Marcar explicitamente no código quando um arquivo existir apenas como compatibilidade temporária.

Critério de aceite:
- Qualquer pessoa ou agente consegue localizar o fluxo completo de pagamentos sem ambiguidade.

### Fase 4 — validar e endurecer o refresh automático do token

Objetivo:
- Evitar reconnect desnecessário e transformar o refresh existente em comportamento operacional confiável.

Tarefas:
- Confirmar em staging que `expires_at` é calculado ao conectar e ao renovar.
- Validar que `getUsableMercadoPagoAccessToken()` tenta refresh antes da falha final.
- Garantir que `reconnect_required` só ocorre após falha de refresh e retry.
- Revisar logs de `refresh_success` e `refresh_failed` para garantir contexto suficiente de tenant e causa.
- Fechar lacunas de documentação e runbook para falhas de refresh.

Critério de aceite:
- Token expirado não quebra checkout, webhook ou reconcile imediatamente quando houver refresh disponível.

### Fase 5 — tornar `payment_mode` operacionalmente inequívoco

Objetivo:
- Garantir que o toggle admin represente exatamente o comportamento real de runtime.

Tarefas:
- Confirmar no backend de checkout a política final:
  - `sandbox` usa ou prefere `sandbox_init_point`.
  - `production` usa ou prefere `init_point`.
- Exigir compatibilidade mínima da conexão com o modo ativo.
- Expor de forma consistente no payload: `mode`, `launchUrl`, `launchUrlType`.
- Atualizar a UI admin para exibir exatamente o que será usado em runtime.
- Eliminar endpoints ou clientes paralelos que possam contornar a regra oficial.

Critério de aceite:
- Mudar `payment_mode` muda o comportamento real do checkout, sem divergência entre API, admin e frontend.

### Fase 6 — testes críticos de pagamentos

Objetivo:
- Dar confiança real ao módulo de pagamentos multi-tenant.

Tarefas:
- Consolidar e completar cobertura explícita para:
  - OAuth state/callback
  - connect/reconnect/disconnect
  - refresh token
  - checkout com token do tenant
  - webhook com token do tenant
  - isolamento entre tenants
  - `payment_mode` sandbox vs production
- Promover os testes críticos para o conjunto mínimo exigido antes de deploy.
- Identificar o que fica em unit, o que fica em smoke e o que depende de staging controlado.

Critério de aceite:
- O módulo de pagamentos tem cobertura explícita dos fluxos críticos e um conjunto mínimo automatizado exigido no gate oficial.

### Fase 7 — hardening e performance

Objetivo:
- Fechar o mínimo necessário de segurança de borda e melhorar carregamento inicial.

Tarefas:
- Confirmar headers mínimos em produção:
  - `Strict-Transport-Security`
  - `Content-Security-Policy` ou plano controlado para sair de `Report-Only`
  - `Permissions-Policy`
- Revisar bundles grandes, especialmente `charts` e vendor.
- Revisar PWA precache e evitar cache excessivo no service worker.
- Aplicar lazy-load onde fizer sentido sem quebrar rotas críticas.

Critério de aceite:
- Há melhora perceptível de segurança de borda e redução de peso inicial sem regressão funcional.

## 9. Ordem de execução

1. Limpar legado quebrado.
2. Corrigir o gate real da Vercel.
3. Consolidar o fluxo oficial de Mercado Pago.
4. Validar e endurecer o refresh automático.
5. Tornar `payment_mode` operacionalmente inequívoco.
6. Fechar a suíte crítica de testes.
7. Endurecer headers e reduzir bundle.

## 10. Definição de pronto

O projeto estará pronto quando:
- o repositório não tiver rotas legadas quebradas nem caminhos críticos concorrentes;
- a Vercel executar o pipeline real completo de produção;
- pagamentos multi-tenant seguirem um único fluxo oficial documentado;
- refresh automático funcionar de forma validada em staging;
- `payment_mode` for real no runtime;
- os testes críticos cobrirem pagamentos multi-tenant;
- produção tiver headers mínimos de segurança e plano claro para CSP enforce.

## 11. Decisão final

O melhor próximo passo não é criar feature nova.

É fazer uma faxina cirúrgica e consolidar o que já funciona.

Hoje o problema principal do ReceitasBell não é falta de capacidade de produto.

É a mistura de código novo bom com legado, ambiguidade operacional e validação incompleta do caminho até produção.

## 12. Referências internas

- `docs/prd/mp-multitenant-pendencias.md`
- `docs/operations/mp-go-live-prd.md`
- `docs/operations/rollout-mp-multitenant.md`
- `docs/operations/runbooks.md`
- `docs/architecture/production-readiness.md`
- `vercel.json`
- `.github/workflows/ci.yml`
