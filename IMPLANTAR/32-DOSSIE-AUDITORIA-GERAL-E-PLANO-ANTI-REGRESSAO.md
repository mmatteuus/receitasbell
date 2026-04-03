# Dossiê de auditoria geral e plano anti-regressão

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Checklist roadmap aplicado

### F0 — Kickoff
- escopo auditado: pasta `IMPLANTAR/`, repositório atual na `main`, produção Vercel, persistência Supabase do Stripe Connect
- estado atual confirmado: produção `READY`, rotas admin vivas, rotas Stripe Connect expostas, onboarding ainda não concluído
- risco principal: barramento `IMPLANTAR/` parcialmente defasado e induzindo passos errados
- suposição mínima reversível: o próximo bloqueio real está no fluxo autenticado/admin + onboarding Stripe, não mais no roteamento da Vercel

### F1 — Checklist
- [x] `IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md` revisado
- [x] `IMPLANTAR/CAIXA-DE-ENTRADA.md` revisada
- [x] `IMPLANTAR/CAIXA-DE-SAIDA.md` revisada
- [x] `IMPLANTAR/STATUS-EXECUCAO.md` revisado
- [x] `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml` revisado
- [x] `vercel.json` revisado
- [x] status real da Vercel revisado
- [x] status real de `/api/admin/auth/session` revisado
- [x] status real de `/api/payments/connect/status` revisado
- [x] persistência de `public.stripe_connect_accounts` revisada
- [ ] fluxo autenticado completo do Stripe Connect provado fim-a-fim
- [ ] onboarding Stripe concluído com conta persistida
- [ ] limpeza final do barramento aprovada

### F2 — Scanner
Arquivos e superfícies relevantes auditados nesta rodada:
- `IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md`
- `IMPLANTAR/CAIXA-DE-ENTRADA.md`
- `IMPLANTAR/CAIXA-DE-SAIDA.md`
- `IMPLANTAR/STATUS-EXECUCAO.md`
- `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
- `vercel.json`
- `api/payments/[...path].ts`
- `src/server/payments/router.ts`
- `src/server/payments/application/handlers/connect/account.ts`
- `src/server/payments/application/handlers/connect/onboarding-link.ts`
- `src/server/payments/application/handlers/connect/status.ts`
- `src/server/payments/repo/accounts.ts`

### F3 — Mapa
Módulos diretamente impactados:
- deploy e roteamento Vercel
- autenticação/sessão admin
- pagamentos Stripe Connect
- persistência Supabase para contas conectadas
- barramento operacional da pasta `IMPLANTAR/`

PII tocada pelo fluxo atual:
- email de admin
- dados de conta conectada Stripe
- cookies/sessão admin

Top 3 fluxos críticos agora:
1. Deploy `main` -> build/gate -> Vercel `READY`
2. Login admin -> sessão válida -> acesso às rotas `/api/payments/connect/*`
3. `POST /api/payments/connect/account` -> persistência em `stripe_connect_accounts` -> `POST /api/payments/connect/onboarding-link` -> retorno do Stripe

Heat map de risco atual:
- P0: barramento `IMPLANTAR/` contraditório
- P0: Stripe Connect ainda não provado fim-a-fim
- P1: risco de regressão de deploy por commits de documentação disparando produção
- P1: risco de falha futura se `APP_BASE_URL` / sessão admin / persistência Stripe divergirem
- P2: risco de limpeza prematura apagar evidência útil

### F4 — Trilha escolhida
**TRILHA B — evoluir e estabilizar o que já existe**

### F5 — Arquitetura e contratos operacionais
Contratos mínimos já existentes e relevantes:
- `GET /api/admin/auth/session` -> 200 com estado autenticado/não autenticado
- `GET /api/payments/connect/status` -> 401 sem sessão; 200 com sessão e sem conta deve retornar `connected:false`
- `POST /api/payments/connect/account` -> criar ou reutilizar conta Stripe Connect e persistir
- `POST /api/payments/connect/onboarding-link` -> gerar link apenas quando houver `stripeAccountId`

Regra de auth obrigatória:
- nenhuma rota de Connect deve ser tratada como funcional apenas por responder 401 sem sessão; isso prova somente roteamento + auth guard, não o onboarding real

### F6 — Resiliência
Regras obrigatórias para esta frente:
- não abrir nova frente enquanto Stripe Connect não estiver provado fim-a-fim
- não alterar mais de um subsistema por rodada
- todo passo com alteração real deve terminar com commit + push na `main`
- não fazer dual-write fora da persistência central `stripe_connect_accounts`

### F7 — Observabilidade
Obrigatório nas próximas rodadas:
- registrar request/response resumido do fluxo Stripe Connect no `STATUS-EXECUCAO.md`
- registrar IDs reais: deploy, tenant, conta Stripe quando criada, status HTTP observado
- registrar o ponto exato da falha: auth, account creation, persistence, onboarding-link ou callback

### F8 — Runbooks
Runbook curto para esta frente:
- se deploy falhar: capturar erro exato do build e parar
- se `/api/payments/connect/status` voltar para 404: revalidar `vercel.json` e `api/payments/[...path].ts`
- se `POST /api/payments/connect/account` retornar 500: capturar erro do handler e consultar `public.stripe_connect_accounts`
- se onboarding-link retornar 404/500: verificar primeiro se a conta já foi persistida

### F9 — Handoff
Este dossiê passa a ser a referência principal para o Executor resolver o que ainda não foi provado e evitar regressões previsíveis.

---

## 2. Snapshot do backend

### FATO confirmado nesta auditoria
- o repositório continua somente na `main`
- o deploy mais recente da Vercel está `READY`
- `GET /api/admin/auth/session` responde corretamente sem sessão
- `GET /api/payments/connect/status` já não responde `404`; agora responde `401` sem sessão, o que prova que o roteamento foi corrigido
- a tabela `public.stripe_connect_accounts` continua vazia nesta auditoria
- `vercel.json` atual contém rewrite explícito para `/api/payments/:path*`
- a pasta `IMPLANTAR/` contém histórico útil, mas também contém instruções antigas que já não refletem o estado atual

### Conclusão objetiva
O gargalo do projeto não é mais deploy quebrado.  
O gargalo atual é **concluir e provar o fluxo autenticado do Stripe Connect com persistência real**, enquanto se corrige o barramento para não mandar o Executor para passos já vencidos.

---

## 3. Trilha escolhida

**TRILHA B — evoluir o backend existente com correções mínimas, reversíveis e verificáveis.**

---

## 4. Top 3 fluxos críticos

### Fluxo 1 — Deploy
Commit na `main` -> `npm run gate` -> deploy Vercel -> `READY`

### Fluxo 2 — Sessão admin
Tela admin -> login -> cookie/sessão -> acesso a rotas administrativas -> sem sessão => 401 controlado

### Fluxo 3 — Stripe Connect
Admin autenticado -> `POST /api/payments/connect/account` -> persistência em `stripe_connect_accounts` -> `POST /api/payments/connect/onboarding-link` -> redirecionamento Stripe -> retorno -> `GET /api/payments/connect/status`

---

## 5. Achados priorizados P0–P3

### P0 — barramento `IMPLANTAR/` contraditório
**Evidência**:
- `CAIXA-DE-ENTRADA.md` ainda aponta para um passo antigo de correção do build
- `STATUS-EXECUCAO.md` já considera deploy/testes concluídos e aponta PASSO 7 aguardando validação
- `ESTADO-ORQUESTRACAO.yaml` também aponta `STRIPE-CONNECT-FIX-0001` aguardando revisão

**Impacto**:
- agentes podem executar instrução velha e reabrir problema já resolvido
- risco alto de retrabalho e regressão operacional

**Correção passo a passo**:
1. considerar este dossiê como referência mais atual
2. na próxima rodada do Executor, atualizar `CAIXA-DE-ENTRADA.md` para refletir o passo real atual
3. alinhar `STATUS-EXECUCAO.md` e `ESTADO-ORQUESTRACAO.yaml` com o mesmo passo

**Como testar**:
- verificar se os três arquivos apontam para o mesmo próximo passo

**Risco de rollout**:
- baixo

---

### P0 — Stripe Connect ainda não está provado fim-a-fim
**Evidência**:
- `/api/payments/connect/status` responde 401 sem sessão, o que prova apenas auth guard
- `public.stripe_connect_accounts` segue vazia
- não há evidência final de criação de conta conectada + onboarding completo

**Impacto**:
- funcionalidade principal de integração com Stripe continua incompleta
- risco de o produto parecer pronto sem conseguir conectar conta de verdade

**Correção passo a passo**:
1. autenticar admin real em produção
2. chamar `POST /api/payments/connect/account`
3. confirmar que uma linha foi criada em `public.stripe_connect_accounts`
4. chamar `POST /api/payments/connect/onboarding-link`
5. abrir o link retornado
6. chamar `GET /api/payments/connect/status` após a criação
7. registrar IDs e resultado real

**Como testar**:
- `public.stripe_connect_accounts` deve sair de 0 para 1 para o tenant atual
- `status` deve retornar 200 autenticado
- `onboarding-link` deve retornar URL válida

**Risco de rollout**:
- baixo a médio, pois mexe com conta Stripe real

---

### P1 — risco de regressão de produção por commits de documentação
**Evidência**:
- o histórico recente disparou vários deploys de produção em commits de docs/IMPLANTAR

**Impacto**:
- filas de deploy desnecessárias
- ruído operacional
- custo de tempo e confusão na auditoria

**Correção passo a passo**:
1. evitar novas rodadas de docs sem necessidade
2. agrupar atualizações documentais em uma única rodada
3. priorizar correções de produto antes de novos arquivos de processo

**Como testar**:
- nas próximas 3 rodadas, cada deploy deve corresponder a uma correção real e não apenas documento

**Risco de rollout**:
- baixo

---

### P1 — risco de falha futura em redirect do Stripe
**Evidência**:
- `buildStripeRedirectUrl()` depende de `APP_BASE_URL`
- links de onboarding dependem desse valor correto

**Impacto**:
- onboarding pode redirecionar para host errado
- usuário pode concluir onboarding e voltar para URL inválida

**Correção passo a passo**:
1. validar `APP_BASE_URL` em produção antes do onboarding real
2. registrar o valor observado no executor sem expor segredo sensível
3. testar callback de refresh e success

**Como testar**:
- o link de onboarding retornado deve usar o domínio final esperado

**Risco de rollout**:
- médio

---

### P2 — risco de conta criada no Stripe sem persistência local
**Evidência**:
- o handler `connect/account` cria a conta Stripe e depois faz `upsert` na tabela local
- se a persistência falhar após a criação remota, há risco de orfandade operacional

**Impacto**:
- conta existe na Stripe, mas o produto não a reconhece
- onboarding-link/status falham por ausência do vínculo local

**Correção passo a passo**:
1. ao testar `connect/account`, capturar o `accountId` retornado
2. confirmar imediatamente a linha correspondente em `public.stripe_connect_accounts`
3. se houver divergência, tratar como P0 de consistência

**Como testar**:
- `stripe_account_id` do retorno deve existir na tabela após o POST

**Risco de rollout**:
- médio

---

### P3 — limpeza final prematura
**Evidência**:
- já existe regra de limpeza final, mas ainda há passos abertos

**Impacto**:
- perda de evidência
- dificuldade de auditoria posterior

**Correção passo a passo**:
1. não executar limpeza final agora
2. só limpar após Stripe Connect funcional e barramento sincronizado

**Como testar**:
- verificar que nenhum arquivo crítico foi removido antes do encerramento

**Risco de rollout**:
- baixo

---

## 6. Arquitetura e contratos propostos

### Contrato operacional mínimo do Stripe Connect

#### `GET /api/payments/connect/status`
- sem sessão: `401`
- com sessão e sem conta: `200 { connected:false }`
- com sessão e com conta: `200 { connected:true, accountId,... }`

#### `POST /api/payments/connect/account`
- sem sessão: `401`
- com sessão admin válida: cria ou reutiliza conta Stripe Connect e persiste
- resposta esperada: `201` ou `200` com `accountId` e `onboardingUrl`

#### `POST /api/payments/connect/onboarding-link`
- sem sessão: `401`
- com sessão e sem conta local: `404`
- com sessão e com conta: `200` com `onboardingUrl`

### Regra de não quebra
- não remover o rewrite `/api/payments/:path*`
- não relaxar auth das rotas de Connect para “testar mais fácil”
- não pular a validação de persistência local após criação da conta

---

## 7. Plano de implementação por fases

### Fase 1 — sincronizar o barramento
Objetivo: alinhar `CAIXA-DE-ENTRADA.md`, `STATUS-EXECUCAO.md` e `ESTADO-ORQUESTRACAO.yaml` ao mesmo próximo passo real.

### Fase 2 — provar criação real da conta Stripe Connect
Objetivo: executar `POST /api/payments/connect/account` com sessão admin e verificar persistência local.

### Fase 3 — provar onboarding-link
Objetivo: executar `POST /api/payments/connect/onboarding-link` depois da conta existir.

### Fase 4 — validar status autenticado
Objetivo: chamar `GET /api/payments/connect/status` autenticado e confirmar `connected:true` ou `connected:false` coerente.

### Fase 5 — estabilização anti-regressão
Objetivo: registrar callback/redirect correto, confirmar `APP_BASE_URL`, evitar novos deploys de docs desnecessários e só então considerar limpeza final.

---

## 8. Observabilidade, testes e CI/CD

### Obrigatório nas próximas rodadas
- registrar o ID do deploy validado
- registrar status HTTP real de cada rota testada
- registrar se a chamada foi sem sessão ou com sessão
- registrar se a tabela `stripe_connect_accounts` mudou
- registrar o `accountId` retornado, quando existir

### Gates mínimos
- `npm run gate`
- teste runtime em produção da rota tocada
- conferência do estado no Supabase quando houver persistência

### Regra CI/CD
- não considerar “deploy READY” como sinônimo de “feature pronta”
- feature Stripe Connect só será considerada pronta após evidência de rota + persistência + onboarding

---

## 9. Runbooks e operação

### Runbook A — se `/api/payments/connect/status` voltar a 404
1. revisar `vercel.json`
2. revisar `api/payments/[...path].ts`
3. redeployar
4. retestar rota sem sessão

### Runbook B — se `connect/account` retornar 500
1. capturar corpo da resposta
2. conferir se a conta foi criada na Stripe
3. conferir `public.stripe_connect_accounts`
4. corrigir inconsistência antes de prosseguir

### Runbook C — se onboarding-link retornar 404
1. verificar se `stripe_connect_accounts` continua vazia
2. chamar `connect/account` antes
3. só depois repetir `onboarding-link`

### Runbook D — se callback do Stripe voltar para URL errada
1. validar `APP_BASE_URL`
2. reexecutar `connect/account` / `onboarding-link`
3. conferir `success_url` e `refresh_url`

---

## 10. Artefatos gerados ou exigidos

### Gerado nesta rodada
- `IMPLANTAR/32-DOSSIE-AUDITORIA-GERAL-E-PLANO-ANTI-REGRESSAO.md`

### Exigidos para a próxima rodada do Executor
- atualização coerente de `IMPLANTAR/CAIXA-DE-ENTRADA.md`
- atualização coerente de `IMPLANTAR/STATUS-EXECUCAO.md`
- atualização coerente de `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
- evidência de `POST /api/payments/connect/account`
- evidência de persistência na tabela local
- evidência de `POST /api/payments/connect/onboarding-link`

---

## 11. Suposições e [PENDENTE]

### FATO
- produção atual responde `READY`
- rota admin responde
- rota de status do Stripe Connect responde `401` sem sessão
- tabela local ainda está vazia

### SUPOSIÇÃO
- a próxima falha mais provável está no fluxo autenticado/persistência, não mais no roteamento

### [PENDENTE]
- validar login admin funcional nesta rodada de Stripe Connect
- validar `POST /api/payments/connect/account` em produção
- validar persistência da conta conectada
- validar `POST /api/payments/connect/onboarding-link`
- validar callbacks de retorno do Stripe

---

## 12. Previsão de falhas futuras

### Horizonte de 3 meses
- regressão de deploy por commits de documentação
- barramento apontando passo antigo e reabrindo correção já feita
- onboarding retornando para host errado se `APP_BASE_URL` divergir

### Horizonte de 1 ano
- conta Stripe conectada órfã por falha entre criação remota e persistência local
- crescimento de inconsistências na pasta `IMPLANTAR/` por excesso de dossiês sem limpeza final controlada
- testes de produção manuais sem trilha suficiente para auditoria

### Horizonte de 3 anos
- acoplamento excessivo entre processo operacional e deploy real
- dívida operacional por barramento documental maior que o próprio produto
- dificuldade de escalar pagamentos/marketplace se Connect não tiver runbooks e reconciliação bem definidos

### Medidas preventivas desde já
- usar apenas um próximo passo oficial por vez
- só abrir nova frente após evidência da anterior
- registrar sempre: deploy ID, status HTTP, accountId, efeito no banco
- não confundir `READY` com funcionalidade concluída
- não executar limpeza final antes de fechar Stripe Connect

---

## 13. Handoff final para o Agente Executor

### Decisão do Pensante
O Executor deve **parar de tentar encerrar a rodada** e executar o próximo passo real: provar Stripe Connect fim-a-fim com sessão admin e persistência local.

### Ordem exata para o Executor
1. ler este dossiê integralmente
2. alinhar `CAIXA-DE-ENTRADA.md`, `STATUS-EXECUCAO.md` e `ESTADO-ORQUESTRACAO.yaml` ao mesmo passo atual
3. autenticar admin no domínio final
4. executar `POST /api/payments/connect/account`
5. registrar resposta e `accountId`
6. validar no Supabase que `public.stripe_connect_accounts` saiu de 0 para 1
7. executar `POST /api/payments/connect/onboarding-link`
8. registrar a URL retornada
9. validar `GET /api/payments/connect/status` autenticado
10. registrar tudo em `IMPLANTAR/CAIXA-DE-SAIDA.md`
11. registrar tudo em `IMPLANTAR/STATUS-EXECUCAO.md`
12. atualizar `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
13. fazer commit
14. fazer push para `origin main`
15. parar no final

### Tarefa executável — modelo obrigatório

#### ID
`STRIPE-CONNECT-E2E-0001`

#### Objetivo
Provar criação, persistência e onboarding de Stripe Connect em produção sem abrir novas frentes.

#### Arquivos-alvo
- `IMPLANTAR/CAIXA-DE-ENTRADA.md`
- `IMPLANTAR/CAIXA-DE-SAIDA.md`
- `IMPLANTAR/STATUS-EXECUCAO.md`
- `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
- quaisquer arquivos mínimos de código, apenas se a execução provar defeito real

#### Pré-requisitos
- domínio final respondendo
- sessão admin válida disponível
- deploy atual `READY`

#### Passos exatos
1. validar sessão admin
2. chamar `POST /api/payments/connect/account`
3. registrar corpo de resposta
4. consultar persistência local
5. chamar `POST /api/payments/connect/onboarding-link`
6. registrar resultado
7. chamar `GET /api/payments/connect/status` autenticado
8. registrar status final do fluxo

#### Comandos exatos
```bash
git checkout main
git pull origin main
npm run gate
# executar a validação/autenticação real via navegador e/ou cliente HTTP do executor
# depois registrar em IMPLANTAR/
git status
git add <arquivos alterados>
git commit -m "fix: provar stripe connect fim-a-fim e alinhar barramento"
git push origin main
```

#### Critério de aceite
- `CAIXA-DE-ENTRADA.md`, `STATUS-EXECUCAO.md` e `ESTADO-ORQUESTRACAO.yaml` apontam o mesmo passo
- `POST /api/payments/connect/account` foi executado
- existe evidência de criação ou reutilização de conta
- a tabela `public.stripe_connect_accounts` deixou de estar vazia para o tenant testado
- `POST /api/payments/connect/onboarding-link` respondeu com URL válida
- houve commit e push

#### Como validar
- conferir resposta HTTP das rotas
- conferir mudança na tabela local
- conferir `RETORNO CURTO`
- conferir commit na `main`

#### Risco
médio, por envolver conta Stripe real e persistência operacional

#### Rollback
- reverter apenas mudanças de código se existirem
- não apagar a conta criada na Stripe sem decisão explícita
- preservar toda evidência na `IMPLANTAR/`

#### Feature flag
não aplicável nesta rodada

#### Estimativa de tempo
curta a média, dependendo de login/admin e onboarding

#### Protocolo de não-quebra verificado
- uma frente por vez
- sem novo ramo
- sem mudança ampla de arquitetura
- sem deploy cego
- com evidência antes do próximo passo
