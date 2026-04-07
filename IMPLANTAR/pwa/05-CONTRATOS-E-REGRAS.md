# Contratos e regras - PWA Online

## CTA de instalacao
Nome unico permitido:
`Instalar aplicativo`

## Placement permitido
- `/pwa/entry`
- `/pwa/login`
- header ao lado do carrinho somente quando houver instrucao explicita do usuario

## Placement proibido
- perfil web
- minha conta web
- admin web
- cards genericos fora de `/pwa/**`, salvo instrucao explicita do usuario

## Ownership de rotas
- `/pwa/**` pertence ao PWA
- paginas PWA nao devem importar telas web inteiras como solucao final
- redirects de auth PWA devem retornar para destino PWA salvo

## Service worker nesta fase
Permitido:
- assets estaticos
- update flow
- limpeza de cache antigo

Proibido:
- offline real
- fila offline
- sync offline
- conflitos offline
