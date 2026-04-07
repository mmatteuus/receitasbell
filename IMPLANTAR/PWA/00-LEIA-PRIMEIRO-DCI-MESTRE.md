# LEIA PRIMEIRO - DCI MESTRE PWA ONLINE

## Pasta canonica
A pasta canonica desta entrega e `IMPLANTAR/PWA`.

## Regra de precedencia
Em caso de conflito entre arquivos desta pasta, a ordem de precedencia e:
1. `00-LEIA-PRIMEIRO-DCI-MESTRE.md`
2. `10-DCI-DETALHADO-POR-ETAPA.md`
3. `11-GUARDRAILS-E-NAO-REGRESSAO.md`
4. `14-EXPERIENCIA-APP-NATIVA.md`
5. `15-ANTI-PADROES-CARA-DE-SITE.md`
6. `16-MICROINTERACOES-E-COMPORTAMENTO.md`
7. `12-ACEITE-POR-TELA.md`
8. `13-ACEITE-POR-ARQUIVO.md`
9. `01-PRD-PWA-ONLINE.md`
10. demais arquivos

## Missao do Agente Executor
Voce nao pensa. Voce nao decide. Voce nao pesquisa. Voce executa exatamente o que esta nesta pasta.

## O que significa sucesso nesta fase
- o usuario sente que esta usando um aplicativo instalado
- o namespace PWA tem densidade, ritmo e navegacao de app
- o web tradicional nao vira ponto principal de instalacao
- o projeto continua estavel
- nenhuma regra de negocio e quebrada

## O que significa nao quebrar o projeto
- nao mudar contratos de API
- nao mudar regras de negocio
- nao remover rotas existentes
- nao quebrar autenticacao
- nao quebrar compra, conta, favoritos ou receita
- nao piorar lint, typecheck, build, unit ou e2e

## Escopo permitido
- CTA de instalacao
- shell PWA
- top bar e bottom nav
- entry page e login page PWA
- busca e receita PWA
- manifesto e icones, se houver necessidade real
- microinteracoes e UX mobile-first
- testes e criterios de aceite

## Escopo proibido
- offline real
- fila offline
- sync offline
- conflitos offline
- mudanca de backend
- troca de stack
- dependencia nova sem motivo tecnico real

## Regra de ouro
Toda alteracao deve ser de baixo raio de impacto e priorizar sensacao de app instalado.

## Regra do CTA
Nome exato obrigatorio:
`Instalar aplicativo`

## Evidencias obrigatorias
- capturas em mobile de `/pwa/entry`, `/pwa/login`, `/pwa/app/buscar`, `/pwa/app/receitas/:slug`
- evidencia da ausencia do CTA nos contextos proibidos
- evidencia de instalacao Android quando suportado
- evidencia da instrucao iOS
- evidencia dos testes finais
