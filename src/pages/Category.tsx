import { useParams, Link } from "react-router-dom";
import { getPublishedRecipes } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/categories";
import RecipeCard from "@/components/RecipeCard";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const cat = getCategoryBySlug(slug || "");
  const recipes = getPublishedRecipes().filter((r) => r.categorySlug === slug);

  if (!cat) {
    return (
      <div className="container px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Categoria não encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 sm:py-10">
      <div className="mb-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link> › {cat.name}
      </div>
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">{cat.emoji} {cat.name}</h1>
      <p className="mt-1 text-muted-foreground">{cat.description}</p>
      {recipes.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      ) : (
        <p className="mt-10 text-center text-muted-foreground">Nenhuma receita nesta categoria ainda.</p>
      )}
    </div>
  );
}
