import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Eye, Pencil, Copy, Trash2, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteRecipe, getRecipes, saveRecipe, uniqueSlug } from "@/lib/repos/recipeRepo";
import { useAppContext } from "@/contexts/app-context";
import type { Recipe } from "@/types/recipe";
import { PriceBadge } from "@/components/price-badge";
import { toast } from "sonner";

export default function RecipeListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { categories } = useAppContext();

  useEffect(() => {
    async function loadRecipes() {
      try {
        setRecipes(await getRecipes());
      } catch (error) {
        console.error("Failed to load recipes", error);
        toast.error("Nao foi possivel carregar as receitas.");
      } finally {
        setLoading(false);
      }
    }

    void loadRecipes();
  }, []);

  async function refresh() {
    try {
      setRecipes(await getRecipes());
    } catch (error) {
      console.error("Failed to refresh recipes", error);
    }
  }

  async function handleTogglePublish(recipe: Recipe) {
    const now = new Date().toISOString();
    await saveRecipe({
      ...recipe,
      status: recipe.status === "published" ? "draft" : "published",
      publishedAt: recipe.status === "draft" ? now : recipe.publishedAt,
    });
    toast.success(recipe.status === "published" ? "Receita movida para rascunho" : "Receita publicada");
    await refresh();
  }

  async function handleDuplicate(recipe: Recipe) {
    await saveRecipe({
      ...recipe,
      id: undefined,
      title: `${recipe.title} (cópia)`,
      slug: uniqueSlug(`${recipe.title} copia`, recipes),
      status: "draft",
      publishedAt: null,
      createdAt: undefined,
    });
    toast.success("Receita duplicada");
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;

    try {
      await deleteRecipe(id);
      setRecipes((current) => current.filter((recipe) => recipe.id !== id));
      toast.success("Receita excluida");
    } catch (error) {
      console.error("Failed to delete recipe", error);
      toast.error("Nao foi possivel excluir a receita.");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Receitas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{recipes.length} receita{recipes.length !== 1 && "s"}</p>
        </div>
        <Link to="/admin/receitas/nova">
          <Button className="gap-2 w-full sm:w-auto">
            <PlusCircle className="h-4 w-4" /> Nova Receita
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Carregando receitas...
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-xl border bg-card sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead>Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => {
                  const category = categories.find((item) => item.slug === recipe.categorySlug);
                  return (
                    <TableRow key={recipe.id}>
                      <TableCell>
                        <p className="font-medium">{recipe.title}</p>
                        <p className="text-xs text-muted-foreground">/{recipe.slug}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {category ? <span>{category.emoji} {category.name}</span> : "-"}
                      </TableCell>
                      <TableCell>
                        <PriceBadge accessTier={recipe.accessTier} priceBRL={recipe.priceBRL} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={recipe.status === "published" ? "default" : "secondary"}>
                          {recipe.status === "published" ? "Publicada" : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {new Date(recipe.updatedAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/receitas/${recipe.id}/editar`}><Button variant="ghost" size="icon" title="Editar"><Pencil className="h-4 w-4" /></Button></Link>
                          <a href={`/receitas/${recipe.slug}${recipe.status === "draft" ? "?preview=1" : ""}`} target="_blank" rel="noopener"><Button variant="ghost" size="icon" title="Preview"><Eye className="h-4 w-4" /></Button></a>
                          <Button variant="ghost" size="icon" title={recipe.status === "published" ? "Despublicar" : "Publicar"} onClick={() => void handleTogglePublish(recipe)}>
                            {recipe.status === "published" ? <FileText className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" title="Duplicar" onClick={() => void handleDuplicate(recipe)}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="Excluir" onClick={() => void handleDelete(recipe.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 space-y-3 sm:hidden">
            {recipes.map((recipe) => {
              const category = categories.find((item) => item.slug === recipe.categorySlug);
              return (
                <div key={recipe.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{recipe.title}</p>
                      <p className="text-xs text-muted-foreground">/{recipe.slug}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {category && <span className="text-xs">{category.emoji} {category.name}</span>}
                        <Badge variant={recipe.status === "published" ? "default" : "secondary"} className="text-xs">
                          {recipe.status === "published" ? "Publicada" : "Rascunho"}
                        </Badge>
                        <PriceBadge accessTier={recipe.accessTier} priceBRL={recipe.priceBRL} />
                      </div>
                    </div>
                    {recipe.image && (
                      <img src={recipe.image} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Link to={`/admin/receitas/${recipe.id}/editar`}><Button variant="outline" size="sm" className="h-8 gap-1 text-xs"><Pencil className="h-3 w-3" /> Editar</Button></Link>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => void handleTogglePublish(recipe)}>
                      {recipe.status === "published" ? <><FileText className="h-3 w-3" /> Despublicar</> : <><Globe className="h-3 w-3" /> Publicar</>}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => void handleDuplicate(recipe)}><Copy className="h-3 w-3" /> Duplicar</Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs text-destructive" onClick={() => void handleDelete(recipe.id)}><Trash2 className="h-3 w-3" /> Excluir</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
