# Não Fazer Nesta Fase — Online

## Proibição absoluta até `APROVADO ONLINE`

Não implementar nesta fase:

- offline completo
- cache de dados de negócio para uso real offline
- IndexedDB funcional para paridade offline
- outbox
- sync em background
- retries offline
- resolução de conflito
- modo avião como requisito pronto
- fila local de mutações
- política de conflito entre cliente e servidor
- promessas de uso offline no texto da interface
- promessas de notificação se isso não estiver validado

## Proibição operacional

- não criar branch
- não reestruturar o app inteiro
- não trocar router
- não trocar stack
- não refatorar auth em larga escala
- não mexer no que já funciona fora do escopo PWA online

## Limite desta fase

A fase online é para:

- manifest
- metas mobile
- instalação
- shell app-like
- update flow
- service worker limitado a assets estáticos
- consistência de CTA e copy

## Sinal de violação

Se aparecer qualquer item abaixo, a execução saiu do escopo:

- falar em offline-first
- criar schema IndexedDB
- salvar dados de negócio para uso sem internet
- implementar sync posterior
- adicionar fila de mutações
- testar modo avião como pronto
