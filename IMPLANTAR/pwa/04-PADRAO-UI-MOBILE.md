# Padrao de UI Mobile - PWA Online

## Regra central
Todo o namespace PWA deve ter aparencia de aplicativo e nao de site adaptado.

## Dimensoes obrigatorias
- campo: altura minima `48px`
- botao primario: altura minima `48px`
- botao secundario: altura minima `48px`
- botao apenas com icone: altura minima `48px`
- item de lista tocavel: altura minima `56px`
- padding interno de card: minimo `16px`

## Padrao de alinhamento
- botoes da mesma linha devem ter a mesma altura
- campos da mesma secao devem ter a mesma altura
- icones nao podem alterar a altura visual do componente
- labels de acao devem ficar em uma linha
- alinhamento vertical deve ser consistente

## Tratamento de texto longo
- usar `truncate` em labels curtos e acoes
- usar `line-clamp` em titulos de card quando necessario
- palavras longas nao podem explodir layout
- toda informacao truncada deve continuar acessivel por `title`, `aria-label` ou detalhe expandido

## Layout mobile-first
- coluna unica como padrao no app
- zero overflow horizontal
- sem espacos vazios exagerados
- safe-area obrigatoria no topo e no rodape
- conteudo com densidade de app
- sem hero de landing page no app autenticado

## Formularios
- teclado correto por tipo de campo
- labels reais
- mensagens de erro claras
- foco visivel
- distancia vertical consistente entre blocos

## Navegacao
- top bar compacta
- bottom nav compacta
- targets confortaveis ao toque
- retorno previsivel
- sem dependencia de hover

## Defeitos proibidos
- botao mais alto que outro por causa de texto maior
- campo maior que outro na mesma secao sem motivo funcional real
- texto estourando a tela
- scroll horizontal
- componente com cara de desktop espremido no mobile
