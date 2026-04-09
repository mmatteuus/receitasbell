# Tarefas Executáveis — PWA Online

## Tarefa 1 — Corrigir `index.html` para app mobile real

### Objetivo

Ajustar a base HTML para instalação e abertura com aparência de app mobile.

### Arquivo a alterar

- `index.html`

### Conteúdo esperado

- `viewport` com `viewport-fit=cover`
- `theme-color` alinhado ao manifest
- metas iOS de web app
- título iOS definido

### Critério de aceite

- o HTML passa a ser compatível com safe areas em iOS
- a instalação não depende de chrome de navegador visualmente “site-like”

### Evidência esperada

- diff do arquivo
- screenshot do head atualizado

### Risco comum

- mexer em SEO ou metas OG sem necessidade

### Correção esperada

- alterar apenas metas PWA/mobile, sem tocar no script principal

---

## Tarefa 2 — Endurecer manifest e SW da fase online

### Objetivo

Garantir bootstrap de entrada estável e impedir cache de API de negócio no online.

### Arquivo a alterar

- `vite.config.ts`

### Conteúdo esperado

- `start_url: '/pwa/entry'`
- remover `runtimeCaching` de `https://api.*`
- manter `autoUpdate`
- manter cache apenas de assets estáticos/workbox padrão

### Critério de aceite

- PWA instalada abre por `/pwa/entry`
- SW não cria cache de API de negócio

### Evidência esperada

- diff do manifest dentro do config
- inspeção do Application > Cache Storage sem cache de API própria

### Risco comum

- quebrar update flow ao mexer demais no bloco do plugin

### Correção esperada

- editar somente campos necessários do `VitePWA`

---

## Tarefa 3 — Padronizar CTA de instalação legacy

### Objetivo

Eliminar divergência de texto e comportamento no CTA de instalação fora da superfície PWA dedicada.

### Arquivo a alterar

- `src/components/layout/InstallAppButton.tsx`

### Conteúdo esperado

- texto visível exato: `Instalar aplicativo`
- `title` e `aria-label` coerentes
- descrições/toasts sem `Instalar app`

### Critério de aceite

- nenhuma superfície exibe CTA divergente

### Evidência esperada

- grep ou busca sem ocorrência funcional de `Instalar App`

### Risco comum

- ocultar texto em breakpoint errado

### Correção esperada

- manter componente funcional, apenas padronizar copy e apresentação

---

## Tarefa 4 — Corrigir hint iOS

### Objetivo

Remover promessa falsa de offline e notificação da fase online.

### Arquivo a alterar

- `src/pwa/components/PwaInstallHintIOS.tsx`

### Conteúdo esperado

- título e corpo focados em instalação e abertura rápida
- sem promessa de offline
- sem promessa de notificação

### Critério de aceite

- nenhum texto da fase online vende recurso de offline pronto

### Evidência esperada

- diff do copy

### Risco comum

- transformar hint em texto longo e ruim para mobile

### Correção esperada

- manter copy curta, direta, orientada à ação

---

## Tarefa 5 — Validar tecnicamente

### Objetivo

Confirmar que as mudanças não quebraram o app.

### Comandos

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e -- --grep "PWA"
```

### Critério de aceite

- todos os comandos acima passam

### Evidência esperada

- logs ou screenshots dos comandos

### Risco comum

- rodar `test:e2e` sem app pronto no ambiente

### Correção esperada

- se necessário, executar a suíte de PWA no setup usado pelo projeto, sem alterar o escopo da tarefa

---

## Tarefa 6 — Validar manualmente

### Objetivo

Fechar a fase online com inspeção real de instalação e abertura.

### Cenários obrigatórios

1. Android Chrome
2. iPhone Safari
3. Desktop Chrome

### Critério de aceite

- instalação possível
- abertura em modo app
- update flow preservado
- login e navegação não quebrados

### Evidência esperada

- 1 screenshot por plataforma
- 1 vídeo curto opcional de instalação Android
