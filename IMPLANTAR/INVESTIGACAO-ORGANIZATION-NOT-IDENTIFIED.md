# Investigação: Erro "Organization not identified"

## 📋 Resumo Executivo
O erro "Organization not identified" é causado por uma **falha na transmissão do `X-Tenant-Slug` header** nas requisições de autenticação em produção. O sistema consegue extrair o tenant apenas se:
1. O header `X-Tenant-Slug` está presente, OU
2. O host tem uma configuração prévia no banco de dados, OU  
3. Há apenas um tenant ativo

## 🔍 Análise Técnica

### Fluxo de Resolução de Tenant

**Arquivo**: [src/server/tenancy/resolver.ts](../src/server/tenancy/resolver.ts)

```typescript
export async function requireTenantFromRequest(request: VercelRequest) {
  const slug = String(request.headers['x-tenant-slug'] || '').trim(); // ❌ VAZIO EM PRODUÇÃO
  const host = normalizeHost(String(request.headers['x-forwarded-host'] || request.headers.host || ''));

  // 1️⃣ Tenta slug (falha se header vazio)
  if (slug) { /* ... */ }

  // 2️⃣ Tenta host (pode falhar se não cadastrado)
  if (host) { /* ... */ }

  // 3️⃣ Fallback: se apenas 1 tenant ativo, usa-o
  const activeTenants = await listActiveTenants();
  if (activeTenants.length === 1) {
    return { tenant: activeTenants[0] };
  }

  // ❌ SEM OPÇÕES = ERRO 401
  throw new ApiError(401, 'Tenant context is required.');
}
```

### Origem do Header `X-Tenant-Slug`

**Arquivo**: [src/lib/api/client.ts:118-124](../src/lib/api/client.ts#L118-L124)

```typescript
export async function jsonFetch<T>(path: string, options: JsonFetchOptions = {}): Promise<T> {
  const headers = new Headers(rawHeaders);
  const tenantSlug = typeof window !== 'undefined' ? getCurrentTenantSlug() : null;
  
  if (tenantSlug) {
    headers.set('X-Tenant-Slug', tenantSlug); // ✅ Adicionado aqui
  }
  // ...
}
```

### Obtenção do `tenantSlug` no Cliente

**Arquivo**: [src/lib/tenant.ts:44-57](../src/lib/tenant.ts#L44-L57)

```typescript
export function getCurrentTenantSlug(pathname?: string | null) {
  const pathToInspect = typeof pathname === "string"
    ? pathname
    : typeof window !== "undefined"
      ? window.location.pathname  // ← DEPENDE DO URL DO NAVEGADOR
      : null;

  if (!pathToInspect) return getStoredPwaTenantSlug();

  const pathTenant = extractTenantSlugFromPath(pathToInspect);
  if (pathTenant) return pathTenant;  // ← Busca `/t/{slug}`
  return resolvePwaTenantSlug(pathToInspect);
}
```

**Pattern Esperado**: `/t/{slug}/*`  
Exemplo: `/t/receitasbell/admin/login`

---

## 🚨 Cenários de Falha

### ❌ Cenário 1: Login Direto em `/admin/login`
```
URL: https://app.com/admin/login
pathToInspect: "/admin/login"
extractTenantSlugFromPath(): null  ← NÃO ENCONTRA `/t/{slug}`
resolvePwaTenantSlug(): ?
X-Tenant-Slug header: NÃO ENVIADO ❌
```

### ❌ Cenário 2: Redirect de Erro de Autenticação
```
URL: https://app.com/admin/login (veio de erro 401 anterior)
Mesmo problema que Cenário 1
```

### ✅ Cenário 3: Login via Rota Correta
```
URL: https://app.com/t/receitasbell/admin/login
pathToInspect: "/t/receitasbell/admin/login"
extractTenantSlugFromPath(): "receitasbell"  ✅
X-Tenant-Slug: "receitasbell"  ✅
```

---

## 📊 Raiz do Problema

**Cadeia de Falha**:

1. **Usuário tenta acessar** `/admin/login` (sem tenant slug na URL)
2. **Frontend chama** `/api/admin/auth/session` (POST)
3. **Cliente HTTP não encontra** tenant slug na URL → Header `X-Tenant-Slug` vazio
4. **Servidor recebe** requisição sem tenant slug
5. **Resolver tenta encontrar** tenant por:
   - [ ] Header `X-Tenant-Slug` → VAZIO
   - [ ] Host + banco de dados → Pode falhar em produção
   - [ ] Fallback único tenant → FALHA se múltiplos tenants
6. **API retorna** `401 "Tenant context is required."`

---

## ✅ Soluções Propostas

### Solução 1: Forçar Rota com Tenant (Curto Prazo)
**Impacto**: Mínimo, apenas front-end  
**Risco**: Necessário testar fluxos de redirect

Modificar [src/pages/admin/LoginPage.tsx](../src/pages/admin/LoginPage.tsx):

```typescript
// Linha 22: Sempre redirecionar para rota com tenant
const canonicalTenantSlug = tenantSlugFromPath || "receitasbell";  // ← Default hardcoded

// Solução melhor: usar localStorage ou fallback sensato
```

**Problema**: E se houver múltiplos tenants? Precisa de contexto.

---

### Solução 2: Enviar Tenant no Body da Requisição (Recomendado)
**Impacto**: Médio, front+back  
**Risco**: Baixo, mudança localizad

**Modificar** [src/lib/api/adminSession.ts:56-67]:

```typescript
export async function loginAdmin(
  input: { email?: string; password?: string; tenantSlug?: string },
): Promise<AdminSessionResponse> {
  const result = await jsonFetch<AdminSessionResponse>("/api/admin/auth/session", {
    method: "POST",
    body: {
      ...input,
      tenantSlug: input.tenantSlug || getCurrentTenantSlug(), // ✅ Fallback
    },
  });
  return result;
}
```

**Modificar** [src/server/admin/auth.ts:89-138]:

```typescript
export async function loginAdmin(
  request: VercelRequest,
  response: VercelResponse,
  input: { email?: string; password?: string; tenantSlug?: string },  // ← NOVO
  options: { logger?: Logger } = {}
): Promise<AdminSessionResponse> {
  // ...
  
  let tenant: { id: string | number; slug: string; name: string };
  try {
    // Tentar tenant do body ANTES de requireTenantFromRequest
    if (input.tenantSlug) {
      const bySlug = await getTenantBySlug(input.tenantSlug);
      if (bySlug) {
        tenant = bySlug;
      } else {
        throw new ApiError(404, `Tenant not found: ${input.tenantSlug}`);
      }
    } else {
      ({ tenant } = await requireTenantFromRequest(request));  // ← Fallback
    }
  } catch (error) {
    logger.warn('admin.login_failed', {
      action: 'admin.login_failed',
      reason: 'tenant_resolution_failed',
    });
    throw error;
  }
  // ...
}
```

---

### Solução 3: Melhorar `requireTenantFromRequest` (Longo Prazo)
**Impacto**: Maior, afeta toda a resolução de tenant  
**Risco**: Médio, pode quebrar fluxos não-admin

Adicionar fallback inteligente em [src/server/tenancy/resolver.ts]:

```typescript
export async function requireTenantFromRequest(
  request: VercelRequest,
  fallbackSlug?: string
) {
  // ... lógica existente ...
  
  const activeTenants = await listActiveTenants();
  
  // ✅ Se há fallback e um único tenant, usar fallback
  if (fallbackSlug && activeTenants.length === 1) {
    const single = activeTenants[0];
    if (single.slug === fallbackSlug || activeTenants.length === 1) {
      return { tenant: single };
    }
  }
  
  // ... resto do código ...
}
```

---

## 🎯 Recomendação Final

**Implementar Solução 2 + 3**:
1. **Curto prazo**: Adicionar `tenantSlug` ao body de `loginAdmin` (rápido, baixo risco)
2. **Longo prazo**: Melhorar resolver para ser mais tolerante (robustez futura)

---

## 📝 Checklist de Validação

- [ ] Testar login em `/admin/login` (sem slug na URL)
- [ ] Testar login em `/t/receitasbell/admin/login` (com slug)
- [ ] Testar em produção com múltiplos tenants
- [ ] Validar logs de erro no Vercel
- [ ] Rodar `npm run gate` antes de deploy

---

*Investigação concluída em 2026-04-06 por Claude Haiku 4.5*
