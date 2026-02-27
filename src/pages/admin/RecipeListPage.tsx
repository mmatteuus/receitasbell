import { useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Eye, Pencil, Copy, Trash2, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRecipes, saveRecipe, deleteRecipe, uniqueSlug, formatBRL } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/categories";
import { Recipe } from "@/types/recipe";
import { PriceBadge } from "@/components/price-badge";

export default function RecipeListPage() {
  const [recipes, setRecipes] = useState(getRecipes);
  const refresh = () => setRecipes([...getRecipes()]);

  const handleTogglePublish = (r: Recipe) => {
    const now = new Date().toISOString();
    saveRecipe({ ...r, status: r.status === "published" ? "draft" : "published", updatedAt: now, publishedAt: r.status === "draft" ? now : r.publishedAt });
    refresh();
  };

  const handleDuplicate = (r: Recipe) => {
    saveRecipe({
      ...r,
      id: crypto.randomUUID(),
      title: r.title + " (cópia)",
      slug: uniqueSlug(r.title + " copia"),
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
    });
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta receita?")) { deleteRecipe(id); refresh(); }
  };

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

      {/* Desktop table */}
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
            {recipes.map((r) => {
              const cat = getCategoryBySlug(r.categorySlug);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">/{r.slug}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {cat && <span>{cat.emoji} {cat.name}</span>}
                  </TableCell>
                  <TableCell>
                    <PriceBadge accessTier={r.accessTier} priceBRL={r.priceBRL} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "published" ? "default" : "secondary"}>
                      {r.status === "published" ? "Publicada" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {new Date(r.updatedAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/receitas/${r.id}/editar`}><Button variant="ghost" size="icon" title="Editar"><Pencil className="h-4 w-4" /></Button></Link>
                      <a href={`/receitas/${r.slug}${r.status === "draft" ? "?preview=1" : ""}`} target="_blank" rel="noopener"><Button variant="ghost" size="icon" title="Preview"><Eye className="h-4 w-4" /></Button></a>
                      <Button variant="ghost" size="icon" title={r.status === "published" ? "Despublicar" : "Publicar"} onClick={() => handleTogglePublish(r)}>
                        {r.status === "published" ? <FileText className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" title="Duplicar" onClick={() => handleDuplicate(r)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 sm:hidden">
        {recipes.map((r) => {
          const cat = getCategoryBySlug(r.categorySlug);
          return (
            <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">/{r.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cat && <span className="text-xs">{cat.emoji} {cat.name}</span>}
                    <Badge variant={r.status === "published" ? "default" : "secondary"} className="text-xs">
                      {r.status === "published" ? "Publicada" : "Rascunho"}
                    </Badge>
                    <PriceBadge accessTier={r.accessTier} priceBRL={r.priceBRL} />
                  </div>
                </div>
                {r.image && (
                  <img src={r.image} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <Link to={`/admin/receitas/${r.id}/editar`}><Button variant="outline" size="sm" className="h-8 gap-1 text-xs"><Pencil className="h-3 w-3" /> Editar</Button></Link>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => handleTogglePublish(r)}>
                  {r.status === "published" ? <><FileText className="h-3 w-3" /> Despublicar</> : <><Globe className="h-3 w-3" /> Publicar</>}
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => handleDuplicate(r)}><Copy className="h-3 w-3" /> Duplicar</Button>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3 w-3" /> Excluir</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
