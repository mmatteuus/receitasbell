# Patches Pendentes — PWA Online

## Patch 1 — `index.html`

### Substituir o bloco `<head>` atual pelos ajustes abaixo

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Receitas Bell</title>
    <meta
      name="description"
      content="Receitas Bell - As melhores receitas caseiras para você fazer em casa"
    />
    <meta property="og:title" content="Receitas Bell" />
    <meta property="og:description" content="Receitas caseiras testadas e aprovadas" />
    <meta property="og:type" content="website" />
    <meta name="theme-color" content="#ea580c" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Receitas Bell" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Intenção

- respeitar safe area no iOS
- alinhar tema visual com o manifest
- reduzir aparência de site ao instalar

---

## Patch 2 — `vite.config.ts`

### Alterar apenas o bloco `VitePWA({ ... })`

### Regras

- manter `registerType: 'autoUpdate'`
- manter `includeAssets`
- manter ícones atuais
- trocar `start_url` para `/pwa/entry`
- remover o `runtimeCaching` de API

### Forma esperada

```ts
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          cleanupOutdatedCaches: true,
          sourcemap: false,
          maximumFileSizeToCacheInBytes: 512 * 1024,
          globIgnores: ['**/*.map', '**/assets/vendor-*.js'],
        },
        manifest: {
          name: 'Receitas do Bell',
          short_name: 'Receitas Bell',
          description: 'Receitas caseiras testadas e aprovadas',
          theme_color: '#ea580c',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/pwa/entry',
          scope: '/',
          orientation: 'portrait-primary',
          categories: ['food', 'lifestyle'],
          screenshots: [
            {
              src: '/pwa/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              form_factor: 'narrow',
            },
            {
              src: '/pwa/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              form_factor: 'wide',
            },
          ],
          icons: [
            {
              src: '/pwa/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa/icons/icon-maskable-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
```

### Intenção

- usar bootstrap de entrada já existente
- impedir cache de API de negócio no online
- manter update flow atual

---

## Patch 3 — `src/components/layout/InstallAppButton.tsx`

### Ajustes obrigatórios

1. trocar label visível de `Instalar` para `Instalar aplicativo`
2. trocar descrições de instrução que usam `Instalar app`
3. manter `aria-label="Instalar aplicativo"`
4. manter o componente resiliente sem quebrar fallback por navegador

### Trocas mínimas

#### Label visível

Trocar:

```tsx
{showLabel && <span className="hidden sm:inline">Instalar</span>}
```

Por:

```tsx
{showLabel && <span>Instalar aplicativo</span>}
```

#### Trecho Android Chrome

Trocar:

```tsx
        toast.info('Toque no menu (⋮) no canto superior direito', {
          description: 'Depois selecione "Instalar app" para adicionar à tela inicial',
        });
```

Por:

```tsx
        toast.info('Toque no menu (⋮) no canto superior direito', {
          description: 'Depois selecione "Instalar aplicativo" para adicionar à tela inicial',
        });
```

#### `title`

Trocar:

```tsx
title={showInstallButton ? 'Instalar como aplicativo' : 'Ver instruções de instalação'}
```

Por:

```tsx
title={showInstallButton ? 'Instalar aplicativo' : 'Ver instruções de instalação'}
```

### Intenção

- cumprir a regra do CTA exato
- evitar drift entre botão legacy e botão PWA

---

## Patch 4 — `src/pwa/components/PwaInstallHintIOS.tsx`

### Ajustar copy para remover promessa de offline

#### Título

Trocar:

```tsx
<h3 className="text-sm font-bold tracking-tight text-foreground">Instale o app Receitas Bell</h3>
```

Por:

```tsx
<h3 className="text-sm font-bold tracking-tight text-foreground">Instalar aplicativo</h3>
```

#### Corpo

Trocar:

```tsx
<p className="text-xs text-muted-foreground leading-snug mt-0.5">
  Acesse suas receitas offline, carregamento mais rápido e notificações.
</p>
```

Por:

```tsx
<p className="text-xs text-muted-foreground leading-snug mt-0.5">
  Abra mais rápido, com aparência de app e acesso direto pela tela inicial.
</p>
```

### Intenção

- remover promessa fora do escopo
- reforçar benefício real da fase online

---

## Patch 5 — busca final obrigatória

### Rodar busca textual após aplicar tudo

Confirmar que não restou CTA funcional divergente:

```bash
grep -R "Instalar App\|Instalar app" -n src tests index.html vite.config.ts
```

### Resultado esperado

- zero ocorrência funcional remanescente em UI PWA
