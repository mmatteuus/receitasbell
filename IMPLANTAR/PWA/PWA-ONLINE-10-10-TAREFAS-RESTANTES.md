# Tarefas Restantes — PWA Online 10/10

## Ordem obrigatória

Executar exatamente nesta ordem.

---

## Tarefa 1 — eliminar o último resíduo `Instalar app`

### Objetivo

Garantir conformidade total do CTA e dos textos auxiliares com a regra:

**`Instalar aplicativo`**

### Arquivo-alvo principal

- `src/components/layout/InstallAppButton.tsx`

### O que fazer

- localizar toda ocorrência residual de `Instalar App` e `Instalar app`
- substituir pela forma final correta quando a ocorrência for funcional de UI
- manter o componente estável sem mexer em lógica além do necessário

### Critério de aceite

- busca textual final sem ocorrência funcional residual em UI

---

## Tarefa 2 — revisar governança dos testes PWA

### Objetivo

Fazer a suíte PWA validar a aplicação real de hoje, e não uma tela antiga.

### Arquivo-alvo principal

- `tests/pwa.spec.ts`

### O que fazer

- revisar expectativas de textos na tela `/pwa/login`
- revisar asserts de botões e labels que possam ter mudado
- manter foco nos comportamentos de valor, não em detalhes frágeis de copy antiga

### O que o teste precisa garantir

- `/pwa/entry` continua redirecionando corretamente
- `/pwa/login` continua funcional
- governança do CTA `Instalar aplicativo` continua protegida
- rotas `/pwa/app/*` continuam protegidas
- responsividade mínima continua coberta

### Critério de aceite

- suíte PWA passando com a UI atual

---

## Tarefa 3 — decidir a duplicidade de instalação

### Objetivo

Eliminar risco estrutural futuro no fluxo de instalação.

### Itens envolvidos

- `src/hooks/use-pwa-install.ts`
- `src/pwa/hooks/useInstallPrompt.ts`
- `src/components/layout/InstallAppButton.tsx`
- `src/pwa/components/InstallAppButton.tsx`

### Decisão obrigatória

Escolher uma das duas:

#### Opção recomendada — consolidar

- mover para uma única fonte de verdade
- manter uma API de uso clara
- garantir o mesmo texto, o mesmo comportamento e a mesma telemetria

#### Opção aceitável — governar explicitamente

- manter duplicidade só se houver motivo real de superfície
- documentar qual componente é usado em qual contexto
- garantir testes específicos cobrindo os dois caminhos

### Critério de aceite

- não existir mais dúvida técnica sobre qual fluxo deve ser alterado no futuro

---

## Tarefa 4 — rodar validação automática completa

### Objetivo

Provar que o PWA online está estável.

### Comandos obrigatórios

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e -- --grep "PWA"
```

### Critério de aceite

- todos os comandos passam
- qualquer falha é corrigida antes de encerrar

---

## Tarefa 5 — rodar validação manual final

### Objetivo

Fechar a fase online com evidência de uso real.

### Plataformas obrigatórias

1. Android Chrome
2. iPhone Safari
3. Desktop Chrome

### Cenários obrigatórios

- instalação disponível quando suportada
- CTA correto
- abertura do app instalado por `/pwa/entry`
- login continua funcional
- navegação `/pwa/app` continua funcional
- update flow não regrediu

### Critério de aceite

- evidência manual registrada
- nenhuma regressão visual ou funcional percebida
