import { Link } from "react-router-dom";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/category";

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
            <h2 className="text-3xl">Ícones de categorias</h2>
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
              to={`/categorias/${category.slug}`}
              className="group flex aspect-square items-center justify-center rounded-xl border bg-card text-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm"
              aria-label={`Abrir categoria ${category.name}`}
            >
              <span className="sr-only">{category.name}</span>
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm sm:text-base">
                {category.name.slice(0, 2).toUpperCase()}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
