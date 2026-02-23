import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Heart, Clock, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRecipeBySlug, getPublishedRecipes, isFavorite, toggleFavorite, getAverageRating, addRating, getComments, addComment } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/categories";
import RatingStars from "@/components/RatingStars";
import RecipeCard from "@/components/RecipeCard";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const isPreview = params.get("preview") === "1";
  const recipe = getRecipeBySlug(slug || "");
  const [fav, setFav] = useState(() => recipe ? isFavorite(recipe.id) : false);
  const [rating, setRating] = useState<{ avg: number; count: number }>(() => recipe ? getAverageRating(recipe.id) : { avg: 0, count: 0 });
  const [comments, setComments] = useState(() => recipe ? getComments(recipe.id) : []);
  const [author, setAuthor] = useState("");
  const [commentText, setCommentText] = useState("");

  if (!recipe || (recipe.status === "draft" && !isPreview)) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-heading text-3xl font-bold">Receita não encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar</Link>
      </div>
    );
  }

  const cat = getCategoryBySlug(recipe.categorySlug);
  const related = getPublishedRecipes().filter((r) => r.categorySlug === recipe.categorySlug && r.id !== recipe.id).slice(0, 3);

  const handleFav = () => {
    toggleFavorite(recipe.id);
    setFav(!fav);
  };

  const handleRate = (v: number) => {
    addRating(recipe.id, v);
    setRating(getAverageRating(recipe.id));
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !commentText.trim()) return;
    addComment(recipe.id, author.trim(), commentText.trim());
    setComments(getComments(recipe.id));
    setAuthor("");
    setCommentText("");
  };

  return (
    <div className="container max-w-3xl py-10">
      {isPreview && (
        <div className="mb-4 rounded-lg bg-warning/20 px-4 py-2 text-sm font-medium text-warning">
          ⚠️ Pré-visualização — esta receita é um rascunho.
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {cat && <Link to={`/categorias/${cat.slug}`} className="hover:text-primary">{cat.name}</Link>}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground">{recipe.title}</span>
      </nav>

      <h1 className="font-heading text-3xl font-bold md:text-4xl">{recipe.title}</h1>
      {recipe.description && <p className="mt-3 text-lg text-muted-foreground">{recipe.description}</p>}

      {recipe.image && (
        <img src={recipe.image} alt={recipe.title} className="mt-6 w-full rounded-xl object-cover" style={{ maxHeight: 420 }} />
      )}

      {/* Meta cards */}
      <div className="mt-6 flex flex-wrap gap-4">
        {recipe.totalTime > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{recipe.totalTime} min</span>
          </div>
        )}
        {recipe.servings > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{recipe.servings} porções</span>
          </div>
        )}
        {rating.count > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <span className="text-sm font-medium">⭐ {rating.avg.toFixed(1)} ({rating.count})</span>
          </div>
        )}
      </div>

      {/* Favorite + Rate */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button variant={fav ? "default" : "outline"} onClick={handleFav} className="gap-2">
          <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
          {fav ? "Salvo" : "Salvar nos favoritos"}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sua nota:</span>
          <RatingStars onChange={handleRate} />
        </div>
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {recipe.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>
      )}

      <Separator className="my-8" />

      {/* Ingredients */}
      <h2 className="font-heading text-2xl font-bold">Ingredientes</h2>
      <ul className="mt-4 space-y-2">
        {recipe.ingredients.map((ing, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            {ing}
          </li>
        ))}
      </ul>

      <Separator className="my-8" />

      {/* Steps */}
      <h2 className="font-heading text-2xl font-bold">Modo de Preparo</h2>
      <ol className="mt-4 space-y-4">
        {recipe.steps.map((step, i) => (
          <li key={i} className="flex gap-4 rounded-lg border bg-card p-4">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>

      <Separator className="my-8" />

      {/* Comments */}
      <h2 className="font-heading text-2xl font-bold">Comentários ({comments.length})</h2>
      <form onSubmit={handleComment} className="mt-4 space-y-3 rounded-lg border bg-card p-4">
        <Input placeholder="Seu nome" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Textarea placeholder="Deixe seu comentário..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} />
        <Button type="submit" size="sm">Comentar</Button>
      </form>
      {comments.length > 0 && (
        <div className="mt-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{c.author}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <>
          <Separator className="my-8" />
          <h2 className="font-heading text-2xl font-bold">Quem gostou também viu</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        </>
      )}
    </div>
  );
}
