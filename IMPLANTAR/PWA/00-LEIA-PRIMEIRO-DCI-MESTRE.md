# LEIA PRIMEIRO - DCI MESTRE PWA ONLINE

## Regra de precedencia
Em caso de conflito entre arquivos desta pasta, a ordem de precedencia e:
1. `00-LEIA-PRIMEIRO-DCI-MESTRE.md`
2. `10-DCI-DETALHADO-POR-ETAPA.md`
3. `11-GUARDRAILS-E-NAO-REGRESSAO.md`
4. `12-ACEITE-POR-TELA.md`
5. `01-PRD-PWA-ONLINE.md`
6. demais arquivos da pasta

## Correcao formal da auditoria anterior
A auditoria anterior esta mantida como base, mas fica corrigida por este documento nos pontos abaixo:
- A pasta canonica desta entrega e `IMPLANTAR/pwa`.
- Nao existe obrigatoriedade operacional de criar uma pasta adicional na raiz para este fluxo.
- O agente executor deve trabalhar a partir desta pasta dentro de `IMPLANTAR/pwa`.
- O objetivo e melhorar o PWA sem quebrar o projeto.
- Toda alteracao deve ser incremental, reversivel e segura.

## Missao do Agente Executor
Voce deve executar melhorias PWA mobile-first sem quebrar a aplicacao, sem alterar regras de negocio e sem introduzir dependencias novas sem necessidade real.

## O que significa nao quebrar o projeto
- nao alterar contratos de API sem necessidade real
- nao alterar regras de autenticacao sem necessidade real
- nao remover rotas existentes
- nao alterar namespace publico web fora do necessario para remover CTA indevido
- nao piorar build, typecheck, lint ou testes
- nao mudar comportamento de compra, conta, favoritos ou receitas alem do que for necessario para governanca PWA

## Objetivo central desta fase
Entregar somente PWA ONLINE com sensacao real de aplicativo instalado em mobile.

## Resultado esperado ao final
- o CTA de instalacao usa exatamente `Instalar aplicativo`
- o CTA aparece apenas nas superficies PWA corretas
- o web tradicional nao oferece instalacao como ponto primario
- `PwaSearchPage` e `PwaRecipePage` deixam de espelhar as telas web
- a shell PWA nao comunica offline pronto
- toda UI PWA relevante fica padronizada para mobile

## Escopo permitido
- manifest
- icones
- instalacao Android
- instrucao iOS
- update flow
- shell PWA online
- responsividade mobile-first
- consistencia visual do namespace PWA
- testes e validacoes PWA

## Escopo proibido nesta fase
- offline real
- cache de dados de negocio para uso offline
- sync offline
- outbox
- resolucao de conflito
- modo aviao como requisito pronto
- mudanca de backend por causa do PWA

## Caminho obrigatorio de execucao
1. ler este arquivo inteiro
2. ler `11-GUARDRAILS-E-NAO-REGRESSAO.md`
3. executar `10-DCI-DETALHADO-POR-ETAPA.md`
4. usar `12-ACEITE-POR-TELA.md` para validar cada superficie
5. usar `08-CHECKLIST-DE-VALIDACAO.md` para fechar o aceite final

## Regra de ouro de implementacao
Toda alteracao deve ser feita com o menor raio de impacto possivel.

## Criterio de design decisorio
Quando existir duvida entre uma solucao com cara de site e outra com cara de app, escolha a com cara de app, desde que nao quebre fluxo existente.

## Regra sobre o CTA de instalacao
Nome exato obrigatorio:
`Instalar aplicativo`

## Regra sobre risco
Se uma alteracao aumentar o risco de regressao em fluxos web tradicionais, a alteracao deve ser isolada ao namespace PWA ou replanejada.

## Comandos obrigatorios no fechamento
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`
- `npm run test:e2e`

## Evidencias obrigatorias
- capturas em mobile de `/pwa/entry`, `/pwa/login`, `/pwa/app/buscar`, `/pwa/app/receitas/:slug`
- evidencias de ausencia do CTA nos contextos proibidos
- evidencia do prompt Android quando suportado
- evidencia da instrucao iOS
- evidencia da suite de testes
