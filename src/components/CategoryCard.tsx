import { Link } from "react-router-dom";
import { Category } from "@/types/recipe";

interface Props {
  category: Category;
  count?: number;
}

export default function CategoryCard({ category, count }: Props) {
  return (
    <Link
      to={`/categorias/${category.slug}`}
      className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
    >
      <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
        {category.emoji}
      </span>
      <h3 className="font-heading text-lg font-semibold">{category.name}</h3>
      <p className="text-xs text-muted-foreground">{category.description}</p>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "receita" : "receitas"}
        </span>
      )}
    </Link>
  );
}
