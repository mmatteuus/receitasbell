# Patch Exato - Categorias, Dialog Mobile e Imagens

Status: PRONTO PARA EXECUCAO
Data: 2026-04-06
Escopo: frontend web somente

## Regra de seguranca
- Nao alterar backend sem validar contrato atual.
- Nao alterar PWA.
- Nao alterar fluxo de autenticacao ja validado na main.
- Fazer pull antes de iniciar e push ao fechar bloco estavel.

---

## BLOCO 1 - Categorias com emoji real

### FATO
- `src/features/home/sections/HomeCategories.tsx` ainda renderiza letras com `category.name.slice(0, 2).toUpperCase()`.
- `src/types/category.ts` ainda nao declara `icon`.
- O banco ja possui `public.categories.icon`.

### Objetivo
Trocar letras por emoji/icone divertido, mantendo fallback seguro.

### Arquivos
- `src/types/category.ts`
- `src/lib/categoryVisuals.ts` [novo]
- `src/features/home/sections/HomeCategories.tsx`

### Patch exato

#### 1. `src/types/category.ts`
```ts
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  icon?: string | null;
}
```

#### 2. `src/lib/categoryVisuals.ts` [novo]
```ts
import type { Category } from '@/types/category';

type CategoryVisual = {
  emoji: string;
  label: string;
};

const CATEGORY_EMOJI_BY_SLUG: Record<string, string> = {
  sopa: '🍲',
  sopas: '🍲',
  caldos: '🍲',
  massas: '🍝',
  doces: '🍰',
  sobremesas: '🍨',
  bolos: '🎂',
  bebidas: '🥤',
  'bebidas-drinks': '🍹',
  jantar: '🍽️',
  almoco: '🍛',
  'almo-o': '🍛',
  salgadas: '🥟',
  saudaveis: '🥗',
  'saud-vel-fit': '🥗',
  'lanches-r-pidos': '🥪',
  'pratos-principais': '🍛',
  'caf-da-manh-': '☕',
  'cafe-da-manha': '☕',
};

const CATEGORY_EMOJI_BY_NAME: Array<[RegExp, string]> = [
  [/sopa|caldo/i, '🍲'],
  [/massa|macarr/i, '🍝'],
  [/doce|sobremesa/i, '🍨'],
  [/bolo/i, '🎂'],
  [/bebida|drink|suco|caf[eé]/i, '🥤'],
  [/jantar|prato principal|almo/i, '🍛'],
  [/lanche/i, '🥪'],
  [/saud[aá]vel|fit|salada/i, '🥗'],
  [/salgad/i, '🥟'],
];

function normalizeIconValue(icon?: string | null) {
  return (icon || '').trim().toLowerCase();
}

function resolveEmojiFromIcon(icon?: string | null) {
  const normalized = normalizeIconValue(icon);
  if (!normalized) return null;
  if (/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(icon || '')) return icon || null;

  if (normalized === 'chef-hat') return '🍽️';
  if (normalized === 'coffee') return '☕';
  if (normalized === 'cake') return '🎂';
  if (normalized === 'ice-cream') return '🍨';
  if (normalized === 'salad') return '🥗';
  if (normalized === 'sandwich') return '🥪';
  if (normalized === 'cup-soda') return '🥤';
  return null;
}

export function resolveCategoryVisual(category: Pick<Category, 'slug' | 'name'> & { icon?: string | null }): CategoryVisual {
  const iconEmoji = resolveEmojiFromIcon(category.icon);
  if (iconEmoji) {
    return { emoji: iconEmoji, label: category.name };
  }

  const slugEmoji = CATEGORY_EMOJI_BY_SLUG[category.slug];
  if (slugEmoji) {
    return { emoji: slugEmoji, label: category.name };
  }

  for (const [pattern, emoji] of CATEGORY_EMOJI_BY_NAME) {
    if (pattern.test(category.name)) {
      return { emoji, label: category.name };
    }
  }

  return { emoji: '🍽️', label: category.name };
}
```

#### 3. `src/features/home/sections/HomeCategories.tsx`
- importar `resolveCategoryVisual`
- substituir o `slice(0, 2)` por emoji

Trecho final do miolo:
```tsx
{featuredCategories.map((category, index) => {
  const visual = resolveCategoryVisual(category);

  return (
    <Reveal key={category.slug} delayMs={index * 35}>
      <Link
        to={`/categorias/${category.slug}`}
        className="group flex aspect-square items-center justify-center rounded-xl border bg-card text-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm"
        aria-label={`Abrir categoria ${category.name}`}
        title={visual.label}
      >
        <span className="sr-only">{visual.label}</span>
        <span
          aria-hidden
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-2xl shadow-sm transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12"
        >
          {visual.emoji}
        </span>
      </Link>
    </Reveal>
  );
})}
```

### Aceite
- nenhuma categoria da home pode exibir sigla/letra
- toda categoria deve exibir emoji
- fallback deve funcionar mesmo sem `icon`

---

## BLOCO 2 - Remover X duplicado no menu mobile

### FATO
- `DialogContent` injeta `Close` automaticamente.
- `Header` e `AdminMobileSidebar` renderizam outro `X` manual.

### Objetivo
Ficar com apenas um botao de fechar por drawer.

### Arquivos
- `src/components/ui/dialog.tsx`
- `src/components/layout/Header.tsx`
- `src/AdminSidebar.tsx`

### Patch exato

#### 1. `src/components/ui/dialog.tsx`
Adicionar prop nova:
```ts
type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  hideCloseButton?: boolean;
};
```

Alterar assinatura:
```ts
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideCloseButton = false, ...props }, ref) => (
```

Render do close:
```tsx
{!hideCloseButton && (
  <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
)}
```

#### 2. `src/components/layout/Header.tsx`
No drawer mobile:
```tsx
<DialogContent
  hideCloseButton
  className="flex h-full max-h-screen w-full flex-col border-none p-0 sm:max-w-full"
>
```

Tambem remover duplicidade de menu:
- excluir o link mobile `Receitas` que aponta para `/buscar`
- manter apenas `Buscar receitas`

E aumentar touch target do botao menu:
```tsx
className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
```

#### 3. `src/AdminSidebar.tsx`
No drawer mobile:
```tsx
<DialogContent
  hideCloseButton
  className="fixed inset-0 z-50 flex h-screen max-h-screen min-h-[100dvh] w-screen min-w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-y-auto border-r bg-card p-0 transition-transform duration-300 rounded-none data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0"
>
```

### Aceite
- menu mobile publico: apenas 1 X
- menu mobile admin: apenas 1 X
- dialog desktop normal continua com close

---

## BLOCO 3 - Imagens das receitas sem reincidencia

### FATO
- `recipes.image_url` possui nome de arquivo cru em varias receitas publicadas.
- nao existe base URL configurada em `settings`.
- o front ja tenta renderizar imagem; o problema esta no valor entregue.

### Objetivo
Impedir que receita publicada continue saindo com `image_url` invalido.

### Regra de validacao obrigatoria
- `image_url` publicado deve ser:
  - `https://...`
  - ou `/...`
- se vier apenas `arquivo.png`, tratar como invalido no publish/save e registrar erro claro

### Acao minima segura agora
- na camada publica que serializa receita para o frontend, validar `image_url`
- se for filename cru, nao devolver esse valor como imagem valida
- retornar `null` e registrar log tecnico
- no admin, bloquear publicacao futura com `image_url` sem URL valida

### Regex de validacao
```ts
const isRenderableImageUrl = (value?: string | null) => {
  if (!value) return false;
  return /^https?:\/\//i.test(value) || value.startsWith('/');
};
```

### Regra futura
- upload precisa persistir URL publica completa, nao apenas nome do arquivo
- qualquer serializer publico deve normalizar antes de responder

### Aceite
- nenhuma receita publicada pode sair do endpoint publico com `image_url` quebrado
- o problema nao pode voltar em novas publicacoes

---

## BLOCO 4 - Nao mexer no que ja foi corrigido

### FATO
Na main atual a conta ja possui:
- botao voltar ao site
- botao sair
- `logoutUser()` no fluxo

Nao refazer esse bloco.

---

## Smoke test obrigatorio
1. abrir home mobile
2. validar categorias com emoji
3. abrir menu mobile publico e confirmar apenas 1 X
4. abrir menu mobile admin e confirmar apenas 1 X
5. abrir conta e validar voltar + sair
6. abrir pelo menos 3 receitas publicadas e confirmar imagem renderizada ou fallback honesto

---

## Rollback
- qualquer regressao visual ou quebra de dialog: reverter apenas BLOCO 2
- qualquer regressao nas categorias: reverter apenas BLOCO 1
- qualquer incerteza na imagem: nao inventar URL; aplicar somente validacao defensiva
