# Limites e Riscos — PWA Online 10/10

## Limite desta etapa

Esta etapa cobre **somente o restante do online**.

### Não entra aqui

- offline completo
- IndexedDB funcional de negócio
- outbox
- sincronização offline
- resolução de conflito
- modo avião como requisito pronto
- fila local de mutações

## Risco 1 — alterar teste sem olhar a tela real

### Problema

Trocar asserts antigos por novos sem validar a UI real no momento da alteração.

### Mitigação

- abrir a tela real
- ajustar o teste para o estado real atual
- preferir asserts de comportamento sobre texto frágil quando possível

## Risco 2 — consolidar instalação e quebrar superfície já funcional

### Problema

Unificar hooks/componentes sem validação pode quebrar um fluxo que hoje funciona.

### Mitigação

- consolidar só se a mudança for pequena e coberta por teste
- se houver risco, manter coexistência com governança explícita

## Risco 3 — corrigir copy e esquecer fallbacks secundários

### Problema

O último `Instalar app` pode não estar só no caminho principal.

### Mitigação

- rodar busca textual final obrigatória
- revisar também toasts, tooltips e descrições

## Risco 4 — declarar 10/10 sem execução real

### Problema

Sem rodar build/testes e sem validar Android/iPhone/Desktop, a nota 10/10 é só estimativa.

### Mitigação

- não encerrar antes das evidências automáticas e manuais

## Regra de encerramento

Não escrever que ficou 10/10 antes de:

- corrigir o residual textual
- alinhar a suíte PWA
- fechar ou governar a duplicidade de instalação
- validar tudo com evidência
