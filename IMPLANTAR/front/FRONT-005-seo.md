# FRONT-005 — SEO + Meta Tags Finais

**Status:** Em implementação  
**Última atualização:** 2026-04-06 — OpenCode  
**Objetivo:** Garantir que todas as rotas públicas e PWA tenham meta tags corretas (title, description, OG image, canonical, noindex/follow).

---

## 1. Audit de Cobertura PageHead

### ✅ Rotas Públicas COM PageHead

| Rota | Arquivo | Status | Noindex | Descrição |
|------|---------|--------|---------|-----------|
| `/` | `Index.tsx` | ✅ | Não | Home page — indexada |
| `/t/:tenant` | `Index.tsx` | ✅ | Não | Home tenant — indexada |
| `/receita/:id` | `RecipePage.tsx` | ✅ | Não | Página de receita — indexada |
| `/categoria/:id` | `Category.tsx` | ✅ | Não | Listagem de categoria — indexada |
| `/buscar` | `Search.tsx` | ✅ | Não | Busca de receitas — indexada |
| `/quem-somos` | `Institutional.tsx` | ✅ | Não | Página institucional — indexada |
| `/checkout` | `CheckoutPage.tsx` | ✅ | **Sim** | Checkout — noindex,nofollow ✓ |
| `/pagamento/pendente` | `PendingPage.tsx` | ✅ | **Sim** | Pendente — noindex,nofollow ✓ |
| `/pagamento/falha` | `FailurePage.tsx` | ✅ | **Sim** | Falha — noindex,nofollow ✓ |
| `/pagamento/sucesso` | `SuccessPage.tsx` | ✅ | **Sim** | Sucesso — noindex,nofollow ✓ |

### ❌ Rotas Públicas SEM PageHead (Necessário Adicionar)

| Rota | Arquivo | Tipo | Noindex | Descrição |
|------|---------|------|---------|-----------|
| `/minha-conta` | `AccountHome.tsx` | Privada* | **Sim** | Conta do usuário — noindex |
| `/carrinho` | `CartPage.tsx` | Privada* | **Sim** | Carrinho — noindex |
| `/meus-favoritos` | `Favorites.tsx` | Privada* | **Sim** | Favoritos — noindex |
| `/lista-de-compras` | `ShoppingListPage.tsx` | Privada* | **Sim** | Lista — noindex |

*Nota: Páginas privadas (requerem autenticação) devem ter `noindex: true` para evitar indexação de URLs de usuários.

### Admin Pages (Sempre `noindex`)

| Rota | Status | Noindex |
|------|--------|---------|
| `/admin/login` | ✅ Tem PageHead via LoginPage | **Sim** |
| `/admin/dashboard` | ❌ Sem PageHead | **Sim** |
| `/admin/recipes` | ❌ Sem PageHead | **Sim** |
| `/admin/settings` | ❌ Sem PageHead | **Sim** |
| Outras `/admin/*` | ❌ Sem PageHead | **Sim** |

---

## 2. Padrão de Implementação

### Template para Adicionar PageHead

```tsx
import { PageHead } from "@/components/PageHead";

export default function MyPage() {
  return (
    <>
      <PageHead
        title="Título da Página"
        description="Descrição breve (155 caracteres máximo)"
        imageUrl="https://cdn.receitasbell.com/og-image.jpg"
        noindex={false} // true para páginas privadas/transacionais
        ogType="website" // ou "article" para posts
        canonicalPath="/minha-rota"
      />
      
      {/* Conteúdo da página */}
    </>
  );
}
```

### Regras de Noindex

- **`noindex: false`** — Públicas, indexáveis (home, receitas, categorias, busca)
- **`noindex: true`** — Privadas ou transacionais (conta, carrinho, checkout, admin)

---

## 3. Checklist de Implementação

### Fase 1: Rotas Privadas (Mais Urgentes)

- [ ] **AccountHome.tsx** (`/minha-conta`)
  ```tsx
  <PageHead
    title="Minha Conta"
    description="Gerencie seu perfil, favoritos e compras"
    noindex={true}
  />
  ```

- [ ] **CartPage.tsx** (`/carrinho`)
  ```tsx
  <PageHead
    title="Carrinho de Compras"
    description="Revise e finalize suas compras de receitas"
    noindex={true}
  />
  ```

- [ ] **Favorites.tsx** (`/meus-favoritos`)
  ```tsx
  <PageHead
    title="Minhas Receitas Favoritas"
    description="Suas receitas favoritas salvas"
    noindex={true}
  />
  ```

- [ ] **ShoppingListPage.tsx** (`/lista-de-compras`)
  ```tsx
  <PageHead
    title="Lista de Compras"
    description="Sua lista de compras personizada"
    noindex={true}
  />
  ```

### Fase 2: Admin Pages

- [ ] **Dashboard.tsx**
  ```tsx
  <PageHead
    title="Painel do Administrador"
    noindex={true}
  />
  ```

- [ ] **RecipeListPage.tsx** (trocar `AdminPageHeader` por `PageHead`)
  ```tsx
  <PageHead
    title="Gerenciar Receitas"
    noindex={true}
  />
  ```

- [ ] **RecipeEditor.tsx**
  ```tsx
  <PageHead
    title="Editar Receita"
    noindex={true}
  />
  ```

- [ ] **SettingsPage.tsx**
  ```tsx
  <PageHead
    title="Configurações do Admin"
    noindex={true}
  />
  ```

- [ ] Outras pages admin (categorias, payments, etc.)

---

## 4. Validação de Meta Tags Existentes

### Verificações a Fazer

Após implementar PageHead, rodar:

```bash
# Lighthouse SEO audit
npm run build
npx lighthouse http://localhost:3000/receita/1 --view

# Ou verificar manualmente
# chrome://inspect → Elementos → <head> → <meta>
```

**Checklist por página:**

- [ ] `<title>` presente e descritivo (50-60 caracteres)
- [ ] `<meta name="description">` presente (150-160 caracteres)
- [ ] `<meta property="og:title">` presente
- [ ] `<meta property="og:description">` presente
- [ ] `<meta property="og:image">` presente (rotas públicas)
- [ ] `<meta property="og:type">` = website ou article
- [ ] `<meta property="og:url">` presente (canonical)
- [ ] `<link rel="canonical">` presente
- [ ] `<meta name="robots">` = "noindex,nofollow" (privadas/transacionais)
- [ ] Twitter card tags presentes

---

## 5. Sitemap e Robots.txt

### Verificação Necessária

- [ ] `public/sitemap.xml` existe e é gerado dinamicamente?
- [ ] `public/robots.txt` existe?
- [ ] Robots.txt permite `/` e `/receita/*` mas bloqueia `/admin` e `/checkout`?

**Padrão esperado em robots.txt:**

```
User-agent: *
Allow: /
Allow: /receita/
Allow: /categoria/
Allow: /buscar
Allow: /quem-somos
Disallow: /admin/
Disallow: /checkout
Disallow: /pagamento/
Disallow: /minha-conta
Disallow: /carrinho
Disallow: /meus-favoritos
Disallow: /lista-de-compras

Sitemap: https://receitasbell.mtsferreira.dev/sitemap.xml
```

---

## 6. OG Images

### Estratégia

- **Home:** Logo ou imagem padrão
- **Receita:** Imagem da receita (`recipe.image_url`)
- **Categoria:** Ícone ou primeira receita da categoria
- **Admin:** Sem OG image necessário (noindex)

### Implementação

Verificar se `RecipePage.tsx` já passa `imageUrl`:

```tsx
<PageHead
  title={recipe.name}
  description={recipe.description}
  imageUrl={getRecipeImage(recipe)?.url} // ← Verificar se existe
  canonicalPath={`/receita/${recipe.slug}`}
/>
```

---

## 7. Testes de SEO

### Ferramentas Recomendadas

1. **Lighthouse** (Chrome DevTools)
   - Auditar cada rota principal
   - Target: SEO score ≥ 90

2. **Google Search Console**
   - Verificar coverage (quantas páginas indexadas)
   - Erros de rastreamento

3. **Screaming Frog SEO Spider** (opcional)
   - Crawl do site inteiro
   - Relatório de broken links

### URLs para Testar

```
https://receitasbell.mtsferreira.dev/              → Home (indexada)
https://receitasbell.mtsferreira.dev/receita/1     → Receita (indexada)
https://receitasbell.mtsferreira.dev/categoria/1   → Categoria (indexada)
https://receitasbell.mtsferreira.dev/minha-conta    → Privada (noindex)
https://receitasbell.mtsferreira.dev/admin/login    → Admin (noindex)
```

---

## 8. Métricas de Sucesso

| Métrica | Target | Status |
|---------|--------|--------|
| Lighthouse SEO | ≥ 90 | ⏳ |
| Todas rotas públicas indexáveis | 100% | ⏳ |
| Todas rotas privadas noindex | 100% | ⏳ |
| Broken canonical links | 0 | ⏳ |
| OG images carregáveis | 100% | ⏳ |
| Robots.txt válido | ✓ | ⏳ |

---

## 9. Plano de Execução

### Sprint 1 (Hoje)
1. Adicionar PageHead às 4 rotas privadas (AccountHome, Cart, Favorites, ShoppingList)
2. Validar sitemap e robots.txt
3. Rodar Lighthouse na home + 2 receitas

### Sprint 2 (Próximos commits)
1. Adicionar PageHead aos pages admin
2. Testar OG images em redes sociais
3. Registrar métricas finais

---

## 📝 Referências

- [PageHead Component](../../src/components/PageHead.tsx)
- [SEO Utils](../../src/lib/seo/)
- [React Helmet Docs](https://github.com/nfl/react-helmet-async)
- [OpenGraph Protocol](https://ogp.me/)

---

_Documento atualizado: 2026-04-06 — OpenCode._
