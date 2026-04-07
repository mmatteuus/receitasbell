# Guardrails e nao regressao - PWA Online

## Regra central
O projeto nao pode ser quebrado. Todas as mudancas desta fase sao de melhoria, governanca e experiencia mobile do PWA.

## Guardrails obrigatorios
- nao remover rotas existentes
- nao alterar contratos de API
- nao alterar regras de negocio
- nao alterar fluxo de compra fora do necessario para preservar navegacao PWA
- nao alterar autenticacao fora do necessario para manter redirect PWA
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
- manter o CTA ao lado do carrinho por instrucao explicita do usuario

Proibido:
- perder links legitimos de navegacao
- quebrar carrinho, tema ou acesso admin

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

## Validacoes obrigatorias apos etapas criticas
Depois das etapas 02, 03, 05 e 06, rodar no minimo:
- `npm run lint`
- `npm run typecheck`

Depois das etapas 05, 06, 08 e 09, rodar:
- `npm run build`

Ao final:
- `npm run test:unit`
- `npm run test:e2e`
