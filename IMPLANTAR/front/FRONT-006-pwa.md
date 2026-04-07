# FRONT-006 — Checklist de Experiência PWA

**Status:** ✅ Concluído (Fase 1)  
**Última atualização:** 2026-04-07 — OpenCode  
**Objetivo:** Medir adesão de instalação PWA e polir UX de onboarding offline + notificações.

---

## 1. Contexto

Após reforçar CTA de instalação PWA em FRONT-003, precisamos:

- **Medir** adesão real (quantos usuários instalam?)
- **Diagnosticar** blocadores (por que não instalam?)
- **Polir** UX (instruções claras, fallbacks, feedbacks)

### ✅ Entregas executadas (2026-04-07)

- `useInstallPrompt` agora registra eventos no `trackEvent`, salva `lastPwaInstallDate` e mostra toast após instalação.
- Novo hook `usePwaState()` expõe `isInstallable`, `isInstalled`, `isPwaSupported`, `isIOS` e `isMobile`.
- `AccountHome` usa o novo hook, mantém o card de instalação e avisa quando o usuário fica offline.
- Eventos `beforeinstallprompt`, `pwa.install_cta_clicked`, `pwa.install_accepted/dismissed` são enviados ao logger/analytics.

### Estados PWA Esperados

```
┌─────────────────────┐
│   Não Instalado     │ ← Usuario vê CTA destacado
└──────────┬──────────┘
           │ (clica em "Instalar")
┌──────────▼──────────┐
│   Instalável        │ ← Browser pronto para instalar
└──────────┬──────────┘
           │ (completa instalação)
┌──────────▼──────────┐
│   Instalado         │ ← App roda no home screen
└─────────────────────┘
```

---

## 2. Plano de Ação

### Fase 1: Instrumentação (P1)

#### 1.1 — Evento de Instalação

- [x] Adicionar listener para `window.addEventListener('appinstalled', ...)`
- [x] Enviar evento ao analytics/logger:
  ```ts
  window.addEventListener('appinstalled', () => {
    trackEvent('pwa.installed', {
      timestamp: new Date().toISOString(),
      platform: navigator.userAgent,
      userEmail: identityEmail,
    });
    console.log('PWA instalado com sucesso!');
  });
  ```
- [x] Registrar em localStorage: `lastPwaInstallDate`

#### 1.2 — Detecção de Estado

- [x] Criar hook `usePwaState()` que retorna:
  ```ts
  {
    isInstallable: boolean; // navigator.standalone === false && beforeinstallprompt disponível
    isInstalled: boolean; // navigator.standalone === true || display-mode === 'standalone'
    isPwaSupported: boolean; // suporta service worker
  }
  ```
- [x] Usar em AccountHome para condicionar exibição de CTA

#### 1.3 — Telemetria de CTAs

- [x] Rastrear cliques em "Instalar agora":
  ```ts
  const handleInstallClick = async () => {
    trackEvent('pwa.install_cta_clicked');
    // se disponível, usar beforeinstallprompt
  };
  ```
- [x] Rastrear rejeições/cancelamentos:
  ```ts
  window.addEventListener('beforeinstallprompt', (e) => {
    e.userChoice.then(({ outcome }) => {
      if (outcome === 'accepted') {
        trackEvent('pwa.install_accepted');
      } else {
        trackEvent('pwa.install_dismissed');
      }
    });
  });
  ```

### Fase 2: UX Polishing (P2)

#### 2.1 — Instruções Offline

- [x] Criar banner em AccountHome:
  - Ícone WiFi desligado
  - Copy: "Acesse suas receitas **offline** — instale agora!"
  - Benefícios listados (acesso offline, sem conexão, carregamento rápido)
- [ ] Verificar Service Worker:
  ```ts
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      console.log('Service Worker pronto para offline');
    });
  }
  ```
- [x] Adicionar toast de fallback se não houver conexão:
  ```ts
  window.addEventListener('offline', () => {
    toast.info('Você está offline — acesse receitas salvas via PWA');
  });
  ```

#### 2.2 — Instruções iOS (Reforço)

- [ ] Validar `PwaInstallHintIOS.tsx` (já melhorado em FRONT-003)
  - Passos numerados (1-Abrir, 2-Share, 3-Add to Home Screen)
  - Gradiente e ícones destacados
  - Dismissível com cookie (não mostrar novamente por 30 dias)
- [ ] Testar em Safari iOS 14+

#### 2.3 — Fallback de Ícones

- [ ] Garantir `apple-touch-icon` em `<head>`:
  ```html
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.json" />
  ```
- [ ] Validar em DevTools: Application → Manifest
- [ ] Testar em Android: esperar ícone 192x192 na home screen

#### 2.4 — Toast de Confirmação

- [x] Ao instalar com sucesso, mostrar toast:
  ```tsx
  window.addEventListener('appinstalled', () => {
    toast.success('App instalado! Acesse via ícone na home screen.');
  });
  ```

### Fase 3: Dashboard de Métricas (P2)

#### 3.1 — Coleta de Dados

- [ ] Criar tabela no Supabase (opcional):
  ```sql
  CREATE TABLE pwa_analytics (
    id UUID PRIMARY KEY,
    event_type TEXT, -- 'install_cta_clicked', 'install_accepted', 'installed'
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    metadata JSONB, -- platform, userAgent, timestamp
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Enviar eventos ao endpoint `/api/analytics/pwa`

#### 3.2 — Relatório de Adesão

- [ ] Página interna `/admin/pwa-metrics` (opcional):
  - Total de usuários instalados
  - Taxa de instalação (% de visitantes)
  - Plataform breakdown (iOS, Android, Desktop)
  - Timeline de instalações (gráfico)

---

## 3. Componentes Afetados

| Arquivo                                    | Mudanças                                  |
| ------------------------------------------ | ----------------------------------------- |
| `src/pages/AccountHome.tsx`                | Usar `usePwaState()` para condicionar CTA |
| `src/hooks/usePwaState.ts`                 | Novo hook de detecção                     |
| `src/components/PwaInstallCard.tsx`        | Novo card com CTA destacado               |
| `src/pwa/components/PwaInstallHintIOS.tsx` | Já refatorado em FRONT-003                |
| `src/server/logger.ts` ou Sentry           | Capturar eventos PWA                      |
| `public/manifest.json`                     | Validar `display: 'standalone'`           |
| `public/apple-touch-icon.png`              | Garantir 180x180px                        |

---

## 4. Checklist de Testes

- [ ] **Instalação em Android**
  - [ ] Exibir banner "Instalar"
  - [ ] Clicar "Instalar" → abre diálogo nativo
  - [ ] Confirmar → evento `appinstalled` dispara
  - [ ] Ícone na home screen aponta para PWA
- [ ] **Instalação em iOS**
  - [ ] Exibir `PwaInstallHintIOS` (passos numerados)
  - [ ] Clicar "Share" → abre menu nativo
  - [ ] Selecionar "Add to Home Screen" → instalado
  - [ ] Validar ícone (apple-touch-icon.png)

- [ ] **Estado Instalado**
  - [ ] `navigator.standalone === true` em app
  - [ ] Acesso offline funciona (service worker ativo)
  - [ ] Dados sincronizam ao reconectar

- [ ] **Telemetria**
  - [ ] Eventos capturados em analytics
  - [ ] Taxa de conversão calculável
  - [ ] Breakdown por plataforma disponível

---

## 5. Próximos Passos (Priorização)

1. **Imediato (P1)**: Instrumentação + eventos de instalação
2. **Curto prazo (P2)**: UX Polishing + instruções offline
3. **Médio prazo (P3)**: Dashboard de métricas (opcional)

---

## 6. Referências

- [Web App Install Prompts (MDN)](https://developer.mozilla.org/en-US/docs/Web/Events/beforeinstallprompt)
- [Service Worker (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [manifest.json](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [iOS PWA Installation](https://web.dev/articles/iphone-install)

---

**Atualizado:** 2026-04-07 — OpenCode
