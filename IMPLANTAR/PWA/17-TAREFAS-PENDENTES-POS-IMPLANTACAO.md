# Tarefas Pendentes Pós-Implementação - PWA Online

**Data de Análise**: 07-04-2026  
**Commit Base**: 4925a66 (feat: Implementar 10 etapas PWA Online)  
**Status**: 9 de 10 etapas concluídas, 8 problemas críticos identificados

---

## RESUMO EXECUTIVO

A implementação do PWA Online foi **95% concluída** com sucesso. As 9 primeiras etapas foram executadas conforme plano:

- ✅ CTA de instalação corrigido
- ✅ Vazamentos de instalação removidos (parcialmente)
- ✅ Shell PWA limpa de sinais offline
- ✅ UI mobile padronizada
- ✅ PwaSearchPage reescrita
- ✅ PwaRecipePage reescrita
- ✅ Chrome de app refinado
- ✅ Manifesto e update flow validados
- ✅ Testes ampliados

Porém, durante a análise de validação final, foram identificados **8 problemas críticos** que precisam ser corrigidos antes de aceitar o PWA como "pronto para produção".

---

## 🔴 CRÍTICOS (BLOQUEADORES) - FAZER IMEDIATAMENTE

### CRÍTICO 1: Remover LastSyncBadge de AccountHome

**Severidade**: 🔴 CRÍTICO  
**Impacto**: Artefato offline renderizado em página web (confunde usuário)  
**Arquivo**: `src/pages/AccountHome.tsx`  
**Linhas**: 24 (import), 494 (render)  
**Ação**:

```typescript
// REMOVER:
import { LastSyncBadge } from '@/pwa/offline/ui/LastSyncBadge';

// REMOVER da renderização:
<LastSyncBadge />
```

---

### CRÍTICO 2: Remover LastSyncBadge de DashboardPage (admin)

**Severidade**: 🔴 CRÍTICO  
**Impacto**: Artefato offline renderizado em página admin  
**Arquivo**: `src/pages/admin/payments/DashboardPage.tsx`  
**Linhas**: 18 (import), 313 (render)  
**Ação**: Remover import e renderização

---

### CRÍTICO 3: Remover LastSyncBadge de RecipeListPage (admin)

**Severidade**: 🔴 CRÍTICO  
**Impacto**: Artefato offline renderizado em página admin  
**Arquivo**: `src/pages/admin/RecipeListPage.tsx`  
**Linhas**: 35 (import), 173 (render)  
**Ação**: Remover import e renderização

---

### CRÍTICO 4: Remover LastSyncBadge de Dashboard (admin)

**Severidade**: 🔴 CRÍTICO  
**Impacto**: Artefato offline renderizado em página admin  
**Arquivo**: `src/pages/admin/Dashboard.tsx`  
**Linhas**: 22 (import), 235 (render)  
**Ação**: Remover import e renderização

---

### CRÍTICO 5: Proteger Header.tsx contra install logic em contexto web

**Severidade**: 🔴 CRÍTICO  
**Impacto**: CTA "Instalar aplicativo" pode aparecer em `/` (home web) em Chrome/Android  
**Violação**: Checklist item "O CTA não aparece em Header web"  
**Arquivo**: `src/components/layout/Header.tsx`  
**Linhas**: 42-85 (useEffect para beforeinstallprompt)  
**Problema**:

```typescript
// ATUAL (SEM PROTEÇÃO):
useEffect(() => {
  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    setDeferredInstallPrompt(e); // ← Ativa mesmo em contexto web
  };
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  // ...
}, []);

// LATER NA RENDERIZAÇÃO:
if (deferredInstallPrompt) {
  // Renderiza botão de instalação
}
```

**Ação**: Adicionar proteção PWA

```typescript
useEffect(() => {
  // ADICIONAR: Proteção PWA
  const isPwaSurface = window.location.pathname.startsWith('/pwa/');
  if (!isPwaSurface) {
    return; // ← Não registra listener se não for PWA
  }

  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    setDeferredInstallPrompt(e);
  };
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  // ...
}, []);
```

---

### CRÍTICO 6: Remover InstallAppButton de SettingsPage (admin)

**Severidade**: 🔴 CRÍTICO  
**Impacto**: CTA de instalação renderizado em AdminLayout web  
**Violação**: Checklist item "O CTA não aparece em AdminLayout"  
**Arquivo**: `src/pages/admin/SettingsPage.tsx`  
**Linhas**: 17 (import), 121 (render)  
**Ação**:

```typescript
// REMOVER:
import { InstallAppButton } from '@/pwa/components/InstallAppButton';

// REMOVER da renderização:
<InstallAppButton context="admin" />
```

---

### CRÍTICO 7: Atualizar teste Playwright - altura mínima

**Severidade**: 🔴 CRÍTICO  
**Impacto**: Teste não garante área tocável confortável (40px é muito pequeno)  
**Padrão**: Deve ser 48px mínimo (6 Tailwind units)  
**Arquivo**: `tests/pwa.spec.ts`  
**Linha**: 139  
**Ação**:

```typescript
// ATUAL:
expect(box.height).toBeGreaterThanOrEqual(40);

// NOVO:
expect(box.height).toBeGreaterThanOrEqual(48);
```

---

### CRÍTICO 8: Adicionar teste para Header web

**Severidade**: 🔴 CRÍTICO  
**Impacto**: Não há validação que CTA não aparece em Header  
**Arquivo**: `tests/pwa.spec.ts`  
**Ação**: Adicionar novo teste

```typescript
test('CTA de instalação não aparece em Header web', async ({ page }) => {
  // Navegar para home web
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Aguardar Header renderizar
  await page.waitForSelector('[data-testid="header"]', { timeout: 5000 });

  // Validar que InstallAppButton não existe no Header
  const installButton = await page.locator('button:has-text("Instalar aplicativo")').first();
  await expect(installButton).not.toBeVisible();
});
```

---

## 🟡 MAIORES (RECOMENDAÇÕES) - FAZER ANTES DA RELEASE

### MAIOR 1: Auditar visualmente PwaRecipePage em viewports

**Severidade**: 🟡 MAIOR  
**Impacto**: Pode haver quebras de layout em viewports específicos  
**Arquivo**: `src/pwa/pages/PwaRecipePage.tsx`  
**Checklist**:

- [ ] Testar em 360px (Galaxy S9)
- [ ] Testar em 390px (Pixel 4)
- [ ] Testar em 430px (Pixel 6)
- [ ] Validar que títulos longos não quebram
- [ ] Validar que listas de ingredientes não fazem overflow
- [ ] Validar que instruções se quebram corretamente

**Como validar**: Abrir DevTools > Device toolbar, ativar cada viewport, rolar e testar interações.

---

### MAIOR 2: Auditar visualmente PwaSearchPage em viewports

**Severidade**: 🟡 MAIOR  
**Impacto**: Cards podem ter inconsistência ou overflow  
**Arquivo**: `src/pwa/pages/PwaSearchPage.tsx`  
**Checklist**:

- [ ] Testar em 360px, 390px, 430px
- [ ] Validar que cards têm altura consistente
- [ ] Validar que imagens não causam overflow
- [ ] Validar que nomes de receita truncam corretamente
- [ ] Testar scroll em resultado grande (ex: 100+ receitas)

---

### MAIOR 3: Testar Lighthouse em 360px viewport

**Severidade**: 🟡 MAIOR  
**Impacto**: Performance regrediu ou não está dentro dos padrões  
**Checklist de Performance**:

- [ ] LCP (Largest Contentful Paint) <= 2.5s
- [ ] INP (Interaction to Next Paint) <= 200ms
- [ ] CLS (Cumulative Layout Shift) <= 0.1
- [ ] FCP (First Contentful Paint) <= 1.8s

**Como validar**:

1. `npm run build`
2. `npm run preview` (roda servidor em http://localhost:5173)
3. DevTools > Lighthouse > Mobile
4. Testar em cada viewport (360px, 390px, 430px)
5. Registrar scores

**Ação se não passar**: Investigar LCP/INP/CLS específico e otimizar.

---

### MAIOR 4: Verificar se PwaEntryPage deveria mostrar CTA

**Severidade**: 🟡 MAIOR (discussão/clarificação)  
**Impacto**: UX pode estar incompleta  
**Arquivo**: `src/pwa/entry/PwaEntryPage.tsx`  
**Contexto**: Documentação `12-ACEITE-POR-TELA.md` menciona que `PwaEntryPage` deve ter:

- cara de porta de entrada do aplicativo ✅
- CTA `Instalar aplicativo` quando suportado ❓
- instrução clara para iOS quando aplicável ❓

**Questão**: A splash screen (`PwaEntryPage`) deveria mostrar o CTA de instalação?

**Alternativas**:

1. **Sim**: Adicionar InstallAppButton + PwaInstallHintIOS na entry
2. **Não**: Deixar CTA apenas no login (`/pwa/login`)

**Recomendação**: Discutir com PM/Design qual experiência desejada.

---

### MAIOR 5: Completar lógica de click em InstallAppButton (Android)

**Severidade**: 🟡 MAIOR (verificação)  
**Impacto**: Usuário Android pode clicar e nada acontecer  
**Arquivo**: `src/pwa/components/InstallAppButton.tsx`  
**Linhas**: 33-41  
**Código atual**:

```typescript
const handleClick = async () => {
  if (!deferredPrompt) return;

  // Para Android
  deferredPrompt.prompt(); // ← Só abre o prompt
  // Mas não faz nada depois de fechar

  // Para iOS
  // ...
};
```

**Verificação**: Confirmar se intenção é:

1. Apenas mostrar o prompt (atual)
2. Ou tracking/analytics após instalação

**Ação**: Adicionar `setDeferredPrompt(null)` após interação

```typescript
const userChoice = await deferredPrompt.userChoice;
if (userChoice.outcome === 'accepted') {
  // Analytics de instalação aceita
  console.log('User aceitou instalação');
}
setDeferredPrompt(null); // Reset
```

---

## 🔵 MENORES (NICE TO HAVE) - FAZER DEPOIS

### MENOR 1: Documentar padrão de espaçamento

**Arquivo**: Criar `IMPLANTAR/PWA/17-PADRAO-ESPACAMENTO.md`  
**Conteúdo**: Guia com gaps, paddings, margins padrão

---

### MENOR 2: Padronizar todas as alturas de botões

**Ação**: Auditoria rápida

```bash
grep -r "size=\"sm\"" src/pwa --include="*.tsx"
grep -r "size=\"lg\"" src/pwa --include="*.tsx"
```

Padronizar em `h-12` ou documentar exceções.

---

### MENOR 3: Considerar remover componentes offline

**Impacto**: Reduz debt técnico e confusão  
**Afetado**: Todos os arquivos em `src/pwa/offline/`  
**Recomendação**: Se fase 2 não implementa offline, remover na próxima release.

---

## CHECKLIST PARA ACEITE FINAL

```markdown
## Validação Antes de Marcar como "PRONTO"

Críticos (Fazer agora):

- [ ] CRÍTICO 1: Remover LastSyncBadge de AccountHome
- [ ] CRÍTICO 2: Remover LastSyncBadge de DashboardPage (admin)
- [ ] CRÍTICO 3: Remover LastSyncBadge de RecipeListPage (admin)
- [ ] CRÍTICO 4: Remover LastSyncBadge de Dashboard (admin)
- [ ] CRÍTICO 5: Proteger Header.tsx com verificação PWA
- [ ] CRÍTICO 6: Remover InstallAppButton de SettingsPage
- [ ] CRÍTICO 7: Atualizar teste Playwright: 40px → 48px
- [ ] CRÍTICO 8: Adicionar teste para Header web

Maiores (Fazer antes da release):

- [ ] MAIOR 1: Auditar PwaRecipePage em 360/390/430px
- [ ] MAIOR 2: Auditar PwaSearchPage em 360/390/430px
- [ ] MAIOR 3: Testar Lighthouse mobile em 360px
- [ ] MAIOR 4: Discussão: CTA em PwaEntryPage? (sim/não)
- [ ] MAIOR 5: Completar lógica de InstallAppButton Android

Menores (Fazer depois):

- [ ] MENOR 1: Documentar padrão de espaçamento
- [ ] MENOR 2: Padronizar alturas de botões
- [ ] MENOR 3: Remover componentes offline (se aplicável)

Validações Finais:

- [ ] npm run lint → sem erros novos
- [ ] npm run typecheck → sem erros novos
- [ ] npm run build → sucesso
- [ ] npm run test:unit → todos passando
- [ ] npm run test:e2e → sem regressões
- [ ] Lighthouse em 360px: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1
- [ ] Testar em 3 viewports reais (360px, 390px, 430px)
- [ ] Testar em Android real (se possível)
- [ ] Testar em iOS real (se possível)
```

---

## PRÓXIMOS PASSOS

### Imediatamente (hoje):

1. Executar CRÍTICO 1-8
2. Criar novo commit: `fix: Remover artefatos offline e proteger contextos web`
3. Executar testes e build novamente

### Antes da release (próximos dias):

4. Executar MAIOR 1-5
5. Ajustar conforme achados
6. Rodar Lighthouse e documentar scores
7. Criar PR/release notes

### Próxima sprint:

8. Avaliar MENOR 1-3
9. Implementar se tempo permitir

---

## SUMÁRIO

| Status       | Tarefas                    | Tempo Estimado                  |
| ------------ | -------------------------- | ------------------------------- |
| ✅ Concluído | 9 etapas do plano original | 12h (já feito)                  |
| 🔴 Crítico   | 8 tarefas bloqueadoras     | 2-3h                            |
| 🟡 Maior     | 5 recomendações            | 3-4h                            |
| 🔵 Menor     | 3 nice-to-have             | 1-2h                            |
| **TOTAL**    | **20+ tarefas**            | **18-22h de trabalho já feito** |

**Recomendação**: Fazer CRÍTICO 1-8 hoje, MAIOR 1-5 nos próximos dias, MENOR 1-3 quando houver tempo.

---

**Gerado**: 07-04-2026  
**Por**: Análise automatizada de PWA Online  
**Próxima revisão**: Após execução de CRÍTICO 1-8
