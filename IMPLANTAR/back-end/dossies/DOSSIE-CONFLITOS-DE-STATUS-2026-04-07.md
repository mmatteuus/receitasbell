# Dossie de Conflitos de Status do Back-end

Data: 2026-04-07

## Problema
Existem documentos antigos e novos no `IMPLANTAR` com estados diferentes para o Stripe e para tarefas do backend.

## Conflitos principais
- ha arquivos antigos que tratam Stripe como quase pronto para producao
- ha trilhas novas que tratam Stripe como dependente de cutover real e validacao de webhook
- ha mais de um ponto de entrada para orientacao do agente

## Regra proposta
Para backend, a trilha canonica passa a ser:
1. `IMPLANTAR/00-LEIA-PRIMEIRO.md`
2. `IMPLANTAR/MAIN-ONLY.md`
3. `IMPLANTAR/CAIXA-DE-ENTRADA.md`
4. `IMPLANTAR/back-end/README.md`
5. `IMPLANTAR/back-end/STATUS-BACK-END.md`
6. `IMPLANTAR/back-end/TAREFAS-BACK-END.md`
7. `IMPLANTAR/back-end/dossies/*`

## Efeito pratico
Qualquer status antigo fora dessa trilha deve ser tratado como historico e nao como fonte de verdade.
