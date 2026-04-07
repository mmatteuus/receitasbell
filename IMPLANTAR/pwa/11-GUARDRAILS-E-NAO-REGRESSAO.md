# Guardrails e nao regressao - PWA Online

## Regra central
O projeto nao pode ser quebrado. Todas as mudancas desta fase sao de melhoria, governanca e experiencia mobile do PWA.

## Guardrails obrigatorios
- nao remover rotas existentes
- nao alterar contratos de API
- nao alterar regras de negocio
- nao alterar fluxo de compra fora do necessario para preservar navegacao PWA
- nao alterar autenticacao fora do necessario para manter redirect PWA
- nao alterar dados persistidos por causa desta fase
- nao trocar stack
- nao adicionar dependencia nova sem justificativa tecnica real

## Guardrails por area

### Conta web
Permitido:
- remover CTA de instalacao

Proibido:
- alterar login, cadastro, reset ou social login alem do estritamente necessario

### Admin web
Permitido:
- remover CTA de instalacao

Proibido:
- alterar sidebar, breadcrumbs, notificacoes ou fluxo admin fora do tema PWA

### Header web
Permitido:
- remover CTA de instalacao do menu mobile e do header

Proibido:
- remover links legitimos de navegacao
- alterar carrinho, tema ou admin sem necessidade

### Shell PWA
Permitido:
- limpar sinais da fase offline
- melhorar top bar, bottom nav e safe-area

Proibido:
- quebrar guard de auth
- quebrar redirect para login PWA

### Busca e receita PWA
Permitido:
- reescrever camada visual
- reordenar blocos para mobile
- padronizar acoes

Proibido:
- trocar fonte de dados sem necessidade
- mudar slug ou contrato de navegacao

## Regra de rollback mental
Se uma alteracao exigir mudar mais de uma camada ao mesmo tempo, reduzir o escopo. Primeiro corrigir a governanca visual. Depois validar. So entao seguir para a proxima tela.

## Regra de isolamento
Sempre preferir:
- mexer em `src/pwa/**`
- mexer no minimo necessario em `src/pages/**` e `src/components/layout/**`

## Validacoes obrigatorias apos cada etapa critica
Depois das etapas 02, 03, 05 e 06, rodar no minimo:
- `npm run lint`
- `npm run typecheck`

Depois das etapas 05, 06, 08 e 09, rodar:
- `npm run build`

Ao final:
- `npm run test:unit`
- `npm run test:e2e`

## Sinais de regressao imediata
- menu mobile web perdeu itens nao relacionados ao PWA
- auth PWA nao redireciona mais corretamente
- busca PWA saiu do namespace `/pwa/**`
- receita PWA abre com layout web tradicional
- CTA de instalacao sumiu tambem das superficies PWA permitidas
- build falha
- Playwright falha nas rotas basicas

## Conduta do executor diante de risco
- nao improvisar
- nao ampliar escopo
- voltar ao menor conjunto de mudancas possivel
- preservar comportamento existente e ajustar apenas o necessario para o PWA online
