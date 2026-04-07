# Microinteracoes e comportamento - PWA Online

## Regra central
O usuario deve sentir resposta rapida, previsivel e limpa a cada toque.

## Regras obrigatorias
- toque em botao gera feedback visual imediato
- estados loading devem ser discretos e claros
- transicoes devem ser curtas e sem exagero
- animacao nao pode atrasar a tarefa principal
- feedback de sucesso ou erro deve aparecer perto do contexto da acao

## Comportamento desejado
- toque: resposta visual instantanea
- loading: curto, limpo e sem tela nervosa
- erro: claro, acionavel e sem drama visual
- vazio: util, com proximo passo obvio
- retorno: previsivel e coerente com app

## Regras de animacao
- usar movimento apenas para orientar
- respeitar `prefers-reduced-motion`
- evitar animacao ornamental longa
- evitar salto de layout

## Regra de continuidade
Ao trocar entre telas PWA, o usuario deve perceber continuidade de aplicativo e nao ruptura de site.
