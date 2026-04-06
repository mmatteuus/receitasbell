# TASK-003: Corrigir 404 na Rota /t/receitasbell

**STATUS**: `[ANÁLISE CONCLUÍDA - PRONTO PARA EXECUÇÃO]`
**PRIORIDADE**: P0 (CRÍTICO - BLOQUEIO DE VENDAS)
**RESPONSÁVEL**: OpenCode
**ESTIMATIVA**: 20 minutos
**ÚLTIMA ATUALIZAÇÃO**: 2026-04-06
**ANÁLISE POR**: Claude (Subagent Explore)

---

## 🎯 OBJETIVO

Corrigir o erro 404 que impede acesso à rota `https://receitasbell.mtsferreira.dev/t/receitasbell`, permitindo usuários acessarem as receitas do tenant principal.

## 🔍 ANÁLISE TÉCNICA - ROOT CAUSE

### Problema Identificado

A rota `/t/receitasbell` retorna 404 porque **o tenant "receitasbell" não existe na tabela `organizations` do Supabase**.

### Fluxo Problemático

1. ✅ **Frontend**: React Router consegue fazer match da rota `/t/receitasbell`
2. ✅ **Frontend**: Renderiza o componente `HomePage` com sucesso
3. ✅ **Frontend**: Extrai slug "receitasbell" da URL
4. 📤 **Frontend**: Faz requisição API com header `X-Tenant-Slug: receitasbell`
5. ❌ **Backend**: Função `requireTenantFromRequest()` tenta localizar tenant
6. ❌ **Database**: Query `SELECT * FROM organizations WHERE slug = 'receitasbell'` retorna `NULL`
7. 💥 **Backend**: Lança erro `ApiError(404, 'Tenant not found for slug: receitasbell')`
8. 💥 **Frontend**: Erro é capturado e exibido: "Não foi possível carregar as receitas"

### Evidência nos Logs

**Arquivo**: `src/server/tenancy/resolver.ts:22`

```typescript
if (!tenant) throw new ApiError(404, `Tenant not found for slug: ${slug}`);
```

**Arquivo**: `api_handlers/public/catalog.ts:29`

```typescript
const { tenant } = await requireTenantFromRequest(request); // ← Lança 404 aqui
```

---

## ⚠️ DUAS OPÇÕES DE SOLUÇÃO

### OPÇÃO A: Criar Tenant no Banco (RECOMENDADO)

**Vantagem**: Suporte real para multi-tenant
**Desvantagem**: Exige seeding de dados

**Passo a passo**:

1. Acessar Supabase SQL Editor
2. Executar script SQL:

```sql
-- 1. Inserir tenant
INSERT INTO organizations (slug, name, is_active, created_at)
VALUES ('receitasbell', 'Receitas Bell', true, now())
ON CONFLICT (slug) DO NOTHING;

-- 2. Verificar ID gerado
SELECT id, slug, name FROM organizations WHERE slug = 'receitasbell';

-- 3. Copiar o ID e atualizar a variável abaixo como {ORG_ID}
```

3. Copiar o `id` retornado (formato: UUID)

4. Executar comando para seed de dados básicos:

```bash
# No diretório raiz do projeto
npm run seed:tenant -- --slug receitasbell
```

Se o comando acima não existir, executar manualmente:

```sql
-- Substituir {ORG_ID} pelo UUID real
INSERT INTO organization_settings (organization_id, key, value)
VALUES
  ('{ORG_ID}', 'name', '"Receitas Bell"'),
  ('{ORG_ID}', 'description', '"Compartilhando receitas deliciosas"'),
  ('{ORG_ID}', 'primary_color', '"#f97316"');

-- Inserir categorias padrão
INSERT INTO categories (organization_id, slug, name, description, is_active)
VALUES
  ('{ORG_ID}', 'sobremesas', 'Sobremesas', 'Receitas de sobremesas doces', true),
  ('{ORG_ID}', 'prato-principal', 'Prato Principal', 'Receitas de pratos principais', true),
  ('{ORG_ID}', 'bebidas', 'Bebidas', 'Bebidas e coquetéis', true);
```

5. Testar rota:

```
https://receitasbell.mtsferreira.dev/t/receitasbell
```

**Critério de Aceite**:

- [ ] Página carrega com status 200
- [ ] HomePage renderiza corretamente
- [ ] Categories aparecem no sidebar

---

### OPÇÃO B: Modificar Fallback de Tenant (ALTERNATIVA)

**Vantagem**: Rápido, sem banco de dados
**Desvantagem**: Perde suporte real para multi-tenant

**Modificar arquivo**: `src/server/tenancy/resolver.ts`

Localizar linhas 9-43 e alterar:

```typescript
// ❌ ANTES
export async function requireTenantFromRequest(
  request: VercelRequest
): Promise<{ tenant: Organization }> {
  const slug = request.headers['x-tenant-slug'] as string;

  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) throw new ApiError(404, `Tenant not found for slug: ${slug}`);
    return { tenant };
  }

  // ... resto do código
}

// ✅ DEPOIS
export async function requireTenantFromRequest(
  request: VercelRequest
): Promise<{ tenant: Organization }> {
  const slug = request.headers['x-tenant-slug'] as string;

  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      // Fallback: usar primeiro tenant ativo
      const tenants = await listActiveTenants();
      if (tenants.length > 0) return { tenant: tenants[0] };
      throw new ApiError(404, `No active tenants found`);
    }
    return { tenant };
  }

  // ... resto do código
}
```

5. Fazer commit:

```bash
git add src/server/tenancy/resolver.ts
git commit -m "fix: Fallback para tenant padrão se slug não encontrado"
```

6. Deploy:

```bash
npm run build
vercel --prod
```

**Critério de Aceite**:

- [ ] Build passa sem erros
- [ ] Deploy completado com sucesso
- [ ] Página `/t/receitasbell` carrega com status 200

---

## 📋 PROCEDIMENTO DE EXECUÇÃO (RECOMENDAÇÃO: OPÇÃO A)

### FASE 1: Criar Tenant (5 min)

**AÇÃO 1.1 - Acessar Supabase SQL**

1. Abrir: `https://supabase.com/dashboard/project/ixfwvaszmngbyxrdiaha`
2. Navegar: `SQL Editor` → `New query`
3. Colar script:

```sql
-- Inserir tenant receitasbell
INSERT INTO organizations (slug, name, is_active, created_at)
VALUES ('receitasbell', 'Receitas Bell', true, now())
ON CONFLICT (slug) DO NOTHING
RETURNING id, slug, name;
```

4. Executar e copiar o `id` gerado

**AÇÃO 1.2 - Seed de Dados Básicos**

1. Colar novo script (substituir `{ORG_ID}` pelo UUID real):

```sql
-- Seed settings
INSERT INTO organization_settings (organization_id, key, value)
VALUES
  ('{ORG_ID}', 'name', '"Receitas Bell"'),
  ('{ORG_ID}', 'description', '"Compartilhando receitas deliciosas"'),
  ('{ORG_ID}', 'primary_color', '"#f97316"')
ON CONFLICT DO NOTHING;

-- Seed categories
INSERT INTO categories (organization_id, slug, name, description, is_active, created_at)
VALUES
  ('{ORG_ID}', 'sobremesas', 'Sobremesas', 'Receitas de sobremesas', true, now()),
  ('{ORG_ID}', 'prato-principal', 'Prato Principal', 'Receitas principais', true, now()),
  ('{ORG_ID}', 'bebidas', 'Bebidas', 'Bebidas e drinks', true, now())
ON CONFLICT DO NOTHING;
```

2. Executar

### FASE 2: Testar Rota (5 min)

**AÇÃO 2.1 - Teste Manual**

1. Abrir browser: `https://receitasbell.mtsferreira.dev/t/receitasbell`
2. Verificar:
   - [ ] Página carrega sem erro 404
   - [ ] Status HTTP 200
   - [ ] HomePage renderiza
   - [ ] Categories aparecem

**AÇÃO 2.2 - Verificar Console**

1. Abrir DevTools (F12)
2. Tab `Console` → verificar se há erros
3. Tab `Network` → verificar status das requisições:
   - GET `/api/settings` → **200**
   - GET `/api/catalog` → **200**

### FASE 3: Documentar e Finalizar (5 min)

**AÇÃO 3.1 - Criar Commit**

```bash
# Nenhuma alteração de código necessária, apenas DB
git log -1 --oneline
# Verificar último commit
```

**AÇÃO 3.2 - Atualizar Documentação**

1. Abrir: `IMPLANTAR/01-TAREFAS-ATIVAS.md`
2. Localizar seção TASK-003
3. Alterar:
   - Status: `[X] CONCLUÍDO`
   - Data: `2026-04-06`

4. Abrir: `IMPLANTAR/TAREFAS_PENDENTES.md`
5. Marcar como `[x]` a linha da rota 404

---

## ✅ CRITÉRIOS DE ACEITE FINAL

- [ ] Tenant "receitasbell" existe na tabela `organizations`
- [ ] Rota `https://receitasbell.mtsferreira.dev/t/receitasbell` retorna status 200
- [ ] HomePage renderiza sem erros
- [ ] API calls `/api/settings` e `/api/catalog` retornam 200
- [ ] Console do browser sem erros relacionados a tenant
- [ ] Categories aparecem na interface

---

## 🔄 PROTOCOLO DE REVERSÃO

SE ALGO QUEBRAR:

**Option A (Desfazer Tenant)**:

```sql
DELETE FROM organizations WHERE slug = 'receitasbell';
```

**Option B (Verificar Status)**:

```sql
SELECT * FROM organizations;
-- Verificar se receitasbell está lá
```

---

## 📝 APÓS CONCLUSÃO

1. ✅ Testar rota novamente
2. ✅ Atualizar `IMPLANTAR/01-TAREFAS-ATIVAS.md` com `[X]`
3. ✅ Mover para `IMPLANTAR/HISTORICO_CONCLUIDO.md`
4. ✅ Adicionar seção de conclusão:

```markdown
## ✅ TASK-003 CONCLUÍDA - 2026-04-06

**Agente**: OpenCode
**Duração**: [Tempo real]
**Solução**: Opção A - Criar tenant no banco
**Resultado**:

- [x] Tenant criado com sucesso
- [x] Rota retorna 200
- [x] HomePage renderiza corretamente
- [x] Categories carregam

**Link de teste**: https://receitasbell.mtsferreira.dev/t/receitasbell
```

---

**Orquestrado por**: Claude (Análise) → OpenCode (Execução)
**Desenvolvido por**: MtsFerreira - [mtsferreira.dev](https://mtsferreira.dev)
