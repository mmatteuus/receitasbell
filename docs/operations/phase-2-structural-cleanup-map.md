# Fase 2 - Mapa de Limpeza Estrutural

Baseado no estado atual do repo em 2026-03-25, cruzando a arvore de arquivos com usos reais via `rg`.

## Progresso executado

- concluido: remocao dos barrels mortos em `src/features/*/index.ts`;
- concluido: remocao de `src/lib/services/baserowService.ts` e `src/lib/payments/repo.ts`;
- concluido: remocao de `tests/_legacy/payments-settings.spec.ts` e `tests/_legacy/sanitize.spec.js`;
- concluido: colapso de `src/pages/public/*.tsx` e de `src/pages/admin/CategoriesPage.tsx`;
- concluido: remocao de `src/components/auth/LegacyAdminRedirect.tsx` e dos aliases legacy equivalentes em `src/router.tsx`;
- concluido: remocao de `src/server/admin/stats.ts` com consolidacao do resumo financeiro dentro de `src/pages/admin/payments/DashboardPage.tsx`.
- concluido: remocao de `src/server/admin/tenantAccess.ts`, que nao possuia imports vivos;
- concluido: remocao do `requireAdminAccess` redundante em `src/server/auth/guards.ts`, mantendo a versao oficial em `src/server/admin/guards.ts`.
- concluido: convergencia de `api/settings.ts` e `api/admin/settings.ts` sobre `src/server/settings/service.ts`, mantendo o endpoint admin como compatibilidade controlada;
- concluido: parser de `src/server/settings/repo.ts` agora entende arrays/numeros/modos persistidos e fallback legado em CSV.
- concluido: `api/admin/auth/bootstrap.ts` e `src/server/admin/auth.ts` deixaram de ser stub; agora criam o primeiro tenant e a primeira sessao owner de forma real;
- concluido: `src/server/tenancy/service.ts` e `src/server/tenancy/repo.ts` agora possuem criacao real de tenant para o bootstrap inicial.
- concluido: remocao de `src/lib/services/mercadoPagoService.ts`; o frontend ficou apontando para utilitario enxuto em `src/lib/payments/checkout.ts`;
- concluido: reducao de compat em `src/lib/repos/paymentRepo.ts`, mantendo apenas o contrato efetivamente usado por checkout e telas admin.
- concluido: contrato publico de `/api/checkout` reduzido para um payload oficial sem aliases como `launchUrl`, `mode`, `primaryPaymentId`, `initPoint` e `sandboxInitPoint`;
- concluido: frontend e testes passaram a consumir `paymentId` + `checkoutUrl` como contrato oficial do checkout.
- concluido: `api/admin/payments.ts` foi alinhado ao contrato do frontend e a superficie dedicada `api/admin/payments/[id].ts` + `api/admin/payments/[id]/note.ts` passou a existir de forma oficial;
- concluido: `src/server/payments/repo.ts` agora concentra lista, detalhe, timeline de webhook e notas internas do admin sem depender de rota legacy com `?id=`.

## Leitura rapida

- `oficial`: fluxo ativo e candidato a permanecer.
- `compat`: camada de compatibilidade ou espelho; pode ficar temporariamente, mas deve sair ao final da consolidacao.
- `morto-provavel`: sem uso real encontrado ou com sinal de trilha quebrada.
- `quarentena`: legado ja isolado fora da trilha principal.

## Fluxos oficiais a preservar

| Path | Status | Acao | Motivo | Risco | Criterio de aceite |
| --- | --- | --- | --- | --- | --- |
| `api/checkout/create.ts` | oficial | manter | endpoint real de criacao de checkout | baixo | front continua chamando uma unica rota de checkout |
| `api/checkout/callback.ts` | oficial | manter | callback OAuth oficial | baixo | callback segue funcionando por tenant |
| `api/checkout/webhook.ts` | oficial | manter | webhook oficial de pagamentos | baixo | webhook continua sincronizando por tenant |
| `api/admin/mercadopago/connect.ts` | oficial | manter | inicio do connect OAuth | baixo | admin conecta conta correta |
| `api/admin/mercadopago/disconnect.ts` | oficial | manter | desconexao oficial | baixo | disconnect segue previsivel |
| `src/server/integrations/mercadopago/client.ts` | oficial | manter | cliente MP usado pelos fluxos oficiais | baixo | checkout/webhook/reconcile seguem usando o mesmo cliente |
| `src/server/integrations/mercadopago/connections.ts` | oficial | manter | store e refresh por tenant | medio | existe uma unica conexao ativa por tenant |
| `src/server/integrations/mercadopago/oauth.ts` | oficial | manter | OAuth oficial | baixo | connect/callback compartilham mesma trilha |
| `src/server/payments/repo.ts` | oficial | manter | persistencia oficial de payment orders | baixo | sem duplicidade de repositorio de pagamentos |
| `src/server/payments/service.ts` | oficial | manter | orquestracao oficial do checkout | baixo | create/webhook/reconcile passam por um servico |
| `api/admin/payments.ts` | oficial | manter | lista oficial do admin no contrato consumido pelo frontend | baixo | `payments`, `items` e filtros do admin seguem em um unico endpoint |
| `api/admin/payments/[id].ts` | oficial | manter | detalhe oficial por transacao | baixo | tela de detalhe usa rota dedicada sem query `?id=` |
| `api/admin/payments/[id]/note.ts` | oficial | manter | persistencia oficial de nota interna | baixo | detalhe do admin salva nota sem adapter paralelo |
| `src/server/tenancy/*` | oficial | manter | resolucao de tenant central | baixo | sem bypass paralelo de tenant |
| `src/server/shared/*` | oficial | manter | contratos HTTP/env/logger/rate-limit | baixo | utilitarios centrais seguem unicos |

## Compatibilidade e espelhos

| Path | Status | Acao | Motivo | Risco | Criterio de aceite |
| --- | --- | --- | --- | --- | --- |
| `src/pages/public/*.tsx` | compat | colapsar na Fase 2 | hoje sao apenas re-exports de `src/pages/*`; mantem uma arvore espelho sem logica propria | baixo | router passa a apontar para uma unica arvore de paginas |
| `src/pages/admin/CategoriesPage.tsx` | compat | colapsar na Fase 2 | e so um re-export de `src/pages/admin/categories/CategoriesPage.tsx` | baixo | admin usa apenas um path fisico de pagina |
| `src/components/auth/LegacyAdminRedirect.tsx` | compat | manter no inicio da Fase 2 e remover no final | hoje serve so para rotas antigas do admin | medio | zero rota antiga dependendo desse redirect |
| trechos legacy em `src/router.tsx` | compat | remover apos confirmar links do admin | rotas `recipes`, `payments`, `settings` e equivalentes antigas ainda entram por redirect | medio | router sem aliases legacy relevantes |
| `api/admin/auth/bootstrap.ts` | oficial | manter e endurecer na Fase 3 | endpoint agora executa o bootstrap inicial real; proximo passo e revisar a estrategia de senha admin por usuario | medio | primeiro tenant nasce com owner valido e sessao do tenant correta |
| `api/admin/settings.ts` | compat | manter como alias controlado para operacao/testes | agora compartilha a mesma logica de leitura/escrita de `api/settings.ts`, preservando o endpoint legado para compatibilidade | baixo | existe uma unica implementacao de regras para settings, mesmo que o endpoint legado continue publicado |

## Morto provavel

| Path | Status | Acao | Motivo | Risco | Criterio de aceite |
| --- | --- | --- | --- | --- | --- |
| `src/features/account/index.ts` | morto-provavel | remover | nenhum import real encontrado | baixo | sem import quebrado apos remocao |
| `src/features/cart/index.ts` | morto-provavel | remover | nenhum import real encontrado | baixo | sem import quebrado apos remocao |
| `src/features/categories/index.ts` | morto-provavel | remover | nenhum import real encontrado | baixo | sem import quebrado apos remocao |
| `src/features/payments/index.ts` | morto-provavel | remover | nenhum import real encontrado; so reexporta camadas ja acessadas direto | baixo | sem import quebrado apos remocao |
| `src/features/recipes/index.ts` | morto-provavel | remover | nenhum import real encontrado; uso atual vai por `use-recipes.ts` | baixo | sem import quebrado apos remocao |
| `src/lib/services/baserowService.ts` | morto-provavel | remover | nenhum uso real encontrado; repo usa `src/server/integrations/baserow/client.ts` | baixo | sem import quebrado apos remocao |
| `src/lib/payments/repo.ts` | morto-provavel | remover | alias `paymentsRepo` sem uso encontrado | baixo | sem import quebrado apos remocao |
| `src/server/admin/stats.ts` | morto-provavel | remover ou reescrever depois | importa `../baserow/paymentsRepo.js`, trilha inexistente na arvore atual | medio | nenhum codigo aponta para esse arquivo ou ele passa a usar repo oficial |
| `tests/_legacy/payments-settings.spec.ts` | morto-provavel | mover para docs ou apagar | teste explicitamente legacy fora da trilha principal | baixo | suite oficial sem depender dele |
| `tests/_legacy/sanitize.spec.js` | morto-provavel | mover para docs ou apagar | teste legacy em JS fora do padrao atual | baixo | suite oficial sem depender dele |

## Quarentena

| Path | Status | Acao | Motivo | Risco | Criterio de aceite |
| --- | --- | --- | --- | --- | --- |
| `src/_legacy/**` | quarentena | manter isolado por enquanto | legado ja esta fora do build e documentado como rollback | baixo | segue excluido do TypeScript e sem imports vivos |

## Nao remover nesta fase

| Path | Motivo |
| --- | --- |
| `src/lib/repos/profileRepo.ts` | apesar do comentario de legado, ainda e usado por `src/pages/AccountHome.tsx` |
| `src/lib/repos/paymentRepo.ts` | continua sendo a facade usada pelas paginas do admin e checkout do front |
| `src/pages/*` | contem a implementacao real; os arquivos em `src/pages/public/*` so espelham esses modulos |
| `src/server/admin/auth.ts` | auth do admin segue em uso por `api/admin/auth/session.ts` e pela tela de login |

## Ordem recomendada de execucao da Fase 2

1. Concluido: remover mortos de baixo risco em `src/features/*/index.ts`, `src/lib/services/baserowService.ts`, `src/lib/payments/repo.ts` e `tests/_legacy/*`.
2. Concluido: colapsar espelhos em `src/pages/public/*` e `src/pages/admin/CategoriesPage.tsx`, ajustando o router para apontar direto para os modulos reais.
3. Concluido: remover compat do admin, apagando `LegacyAdminRedirect` e as rotas antigas em `src/router.tsx`.
4. Concluido: alinhar o dominio de pagamentos do admin com rotas dedicadas para lista, detalhe e nota interna.
5. Em aberto: revisar restos de legado por dominio: auth e Mercado Pago no backend administrativo.
6. Em aberto: rodar gate completo, incluindo `npm run test:unit`, ao final do lote atual.

## Definition of Done da Fase 2

- existe um unico path fisico por pagina publica e por pagina admin relevante;
- nao ha barrel sem uso em `src/features/`;
- nao ha alias morto em `src/lib/`;
- nao ha redirect legacy no router do admin;
- `src/_legacy/**` permanece isolado e sem imports vivos;
- o gate tecnico continua verde: lint, typecheck e build.
