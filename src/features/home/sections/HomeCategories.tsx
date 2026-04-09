import { Link } from 'react-router-dom';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types/category';

const CATEGORY_ICONS: Record<string, string> = {
  // slugs comuns
  doces: '🍰',
  bolos: '🎂',
  tortas: '🥧',
  massas: '🍝',
  salgadas: '🥘',
  salgados: '🥐',
  sopas: '🍲',
  saladas: '🥗',
  carnes: '🥩',
  frango: '🍗',
  peixes: '🐟',
  frutos_do_mar: '🦐',
  vegetariano: '🥦',
  vegano: '🌱',
  saudaveis: '🥑',
  bebidas: '🥤',
  cafe: '☕',
  paes: '🍞',
  pizzas: '🍕',
  lanches: '🥪',
  sobremesas: '🍮',
  cafe_da_manha: '🍳',
  almoço: '🍽️',
  almoco: '🍽️',
  jantar: '🌙',
  snacks: '🥨',
  fitness: '💪',
  rapidas: '⚡',
  gratinados: '🫕',
  gratins: '🫕',
};

function isImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('/');
}

function getCategoryIcon(category: Category): { type: 'emoji' | 'image'; value: string } {
  if (category.icon) {
    if (isImageUrl(category.icon)) return { type: 'image', value: category.icon };
    return { type: 'emoji', value: category.icon };
  }
  const slug = (category.slug || '').toLowerCase().replace(/-/g, '_');
  const name = (category.name || '').toLowerCase().replace(/\s+/g, '_');
  const emoji = CATEGORY_ICONS[slug] || CATEGORY_ICONS[name] || '🍴';
  return { type: 'emoji', value: emoji };
}

type HomeCategoriesProps = {
  categories: Category[];
  onBrowseAll: () => void;
};

export function HomeCategories({ categories, onBrowseAll }: HomeCategoriesProps) {
  const featuredCategories = categories.slice(0, 8);

  return (
    <section className="container px-4 py-12">
      <Reveal>
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Descubra por tema
            </p>
            <h2 className="text-3xl">Categorias</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Toque em um ícone para navegar ou abra o catálogo completo para ver todos os detalhes.
            </p>
          </div>
          <Button variant="link" onClick={onBrowseAll} className="px-0">
            Ver catálogo completo
          </Button>
        </div>
      </Reveal>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
        {featuredCategories.map((category, index) => (
          <Reveal key={category.slug} delayMs={index * 35}>
            <Link
              to={`/buscar?category=${category.slug}`}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card px-2 py-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
              aria-label={`Abrir categoria ${category.name}`}
            >
              {(() => {
                const icon = getCategoryIcon(category);
                return icon.type === 'image' ? (
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 overflow-hidden transition-transform duration-300 group-hover:scale-110"
                  >
                    <img src={icon.value} alt="" className="h-8 w-8 object-contain" />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-3xl leading-none transition-transform duration-300 group-hover:scale-110"
                  >
                    {icon.value}
                  </span>
                );
              })()}
              <span className="text-[11px] font-medium leading-tight text-muted-foreground group-hover:text-foreground line-clamp-2">
                {category.name}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
