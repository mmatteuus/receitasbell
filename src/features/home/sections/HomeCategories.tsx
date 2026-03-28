import { Link } from "react-router-dom";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/category";

type HomeCategoriesProps = {
  categories: Category[];
  onBrowseAll: () => void;
};

export function HomeCategories({ categories, onBrowseAll }: HomeCategoriesProps) {
  return (
    <section className="container px-4 py-12">
      <Reveal>
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Descubra por tema
            </p>
            <h2 className="text-3xl">Coleções por categoria</h2>
          </div>
          <Button variant="link" onClick={onBrowseAll} className="px-0">
            Ver catálogo completo
          </Button>
        </div>
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <Reveal key={category.slug} delayMs={index * 35}>
            <Link
              to={`/categorias/${category.slug}`}
              className="group block rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-xl">
                {category.name.slice(0, 1)}
              </div>
              <h3 className="text-xl">{category.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
              <p className="mt-4 text-sm font-medium text-primary">Explorar categoria</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
