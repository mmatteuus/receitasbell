import { useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Eye, Pencil, Copy, Trash2, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRecipes, saveRecipe, deleteRecipe, generateSlug } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/categories";
import { Recipe } from "@/types/recipe";

export default function RecipeListPage() {
  const [recipes, setRecipes] = useState(getRecipes);

  const refresh = () => setRecipes([...getRecipes()]);

  const handleTogglePublish = (r: Recipe) => {
    const now = new Date().toISOString();
    saveRecipe({
      ...r,
      status: r.status === "published" ? "draft" : "published",
      updatedAt: now,
      publishedAt: r.status === "draft" ? now : r.publishedAt,
    });
    refresh();
  };

  const handleDuplicate = (r: Recipe) => {
    const newSlug = generateSlug(r.title + " copia");
    saveRecipe({
      ...r,
      id: crypto.randomUUID(),
      title: r.title + " (cópia)",
      slug: newSlug,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
    });
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta receita?")) {
      deleteRecipe(id);
      refresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Receitas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{recipes.length} receita{recipes.length !== 1 && "s"}</p>
        </div>
        <Link to="/admin/receitas/nova">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Receita
          </Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Atualizado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map((r) => {
              const cat = getCategoryBySlug(r.categorySlug);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">/{r.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {cat && <span>{cat.emoji} {cat.name}</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "published" ? "default" : "secondary"}>
                      {r.status === "published" ? "Publicada" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {new Date(r.updatedAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/receitas/${r.id}/editar`}>
                        <Button variant="ghost" size="icon" title="Editar"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <a
                        href={`/receitas/${r.slug}${r.status === "draft" ? "?preview=1" : ""}`}
                        target="_blank"
                        rel="noopener"
                      >
                        <Button variant="ghost" size="icon" title="Preview"><Eye className="h-4 w-4" /></Button>
                      </a>
                      <Button variant="ghost" size="icon" title={r.status === "published" ? "Despublicar" : "Publicar"} onClick={() => handleTogglePublish(r)}>
                        {r.status === "published" ? <FileText className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" title="Duplicar" onClick={() => handleDuplicate(r)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
