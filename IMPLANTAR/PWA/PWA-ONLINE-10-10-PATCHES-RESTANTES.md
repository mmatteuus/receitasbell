# Patches Restantes — PWA Online 10/10

## Patch 1 — residual `Instalar app`

### Arquivo

- `src/components/layout/InstallAppButton.tsx`

### Ajuste obrigatório

No trecho de fallback desktop/Chrome, trocar a descrição que ainda usa `Instalar app`.

#### Trocar

```tsx
      toast.info('Clique no ícone de instalação na barra de endereço', {
        description: 'Procure por um ícone de "+download" ou use o menu (⋮) > Instalar app',
      });
```

#### Por

```tsx
      toast.info('Clique no ícone de instalação na barra de endereço', {
        description:
          'Procure por um ícone de "+download" ou use o menu (⋮) > Instalar aplicativo',
      });
```

### Resultado esperado

- nenhuma copy funcional residual divergente

---

## Patch 2 — suíte PWA alinhada à UI atual

### Arquivo

- `tests/pwa.spec.ts`

### Ajuste obrigatório

Revisar expectativas frágeis de copy que não representam mais a tela real.

### Diretriz

Trocar asserts de texto antigo por asserts da UI real, sem perder cobertura de comportamento.

### Exemplos de revisão

#### Onde hoje houver expectativa antiga incompatível

Exemplo de padrão a revisar:

```ts
await expect(page.locator("button:has-text('Entrar com link mágico')")).toBeVisible();
```

#### Substituir por expectativa coerente com a UI atual

Exemplo seguro:

```ts
await expect(page.locator('h1')).toContainText('Receitas Bell');
await expect(page.locator("button:has-text('Entrar com Google')")).toBeVisible();
await expect(page.locator("button:has-text('Entrar')")).toBeVisible();
```

> O agente deve validar a UI real no momento da alteração e ajustar o teste para o que a tela efetivamente renderiza.

### Resultado esperado

- testes verificam comportamento atual
- cobertura de governança do CTA continua viva

---

## Patch 3 — consolidar ou governar a duplicidade de instalação

### Arquivos envolvidos

- `src/hooks/use-pwa-install.ts`
- `src/pwa/hooks/useInstallPrompt.ts`
- `src/components/layout/InstallAppButton.tsx`
- `src/pwa/components/InstallAppButton.tsx`

### Caminho recomendado

#### Se a consolidação for segura

- escolher um único hook como fonte de verdade
- adaptar os dois botões para usar a mesma base
- preservar telemetria necessária
- preservar diferença de superfície apenas no nível de apresentação

#### Se a consolidação não for segura agora

Criar governança explícita por comentário técnico e testes.

### Documentação mínima no código

Inserir comentário curto no topo dos dois componentes indicando:

- qual superfície cada um atende
- por que ainda coexistem
- onde deve ser alterado o fluxo principal de instalação

### Resultado esperado

- reduzir risco de drift futuro

---

## Patch 4 — busca final obrigatória

Depois de tudo, rodar:

```bash
grep -R "Instalar App\|Instalar app" -n src tests index.html vite.config.ts
```

### Aceite

- nenhuma ocorrência funcional residual de UI
