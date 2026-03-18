import { useEffect, useState } from "react";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addCategory, editCategory, getCategories, removeCategory } from "@/lib/repos/categoryRepo";
import type { Category } from "@/types/recipe";
import { useAppContext } from "@/contexts/app-context";
import { toast } from "sonner";

type FormState = {
  id?: string;
  name: string;
  emoji: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  emoji: "",
  description: "",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refreshCategories } = useAppContext();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setCategories(await getCategories());
      } catch (error) {
        console.error("Failed to load categories", error);
        toast.error("Nao foi possivel carregar as categorias.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function reload() {
    const next = await getCategories();
    setCategories(next);
    await refreshCategories();
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await editCategory(form.id, form);
        toast.success("Categoria atualizada");
      } else {
        await addCategory(form);
        toast.success("Categoria criada");
      }
      resetForm();
      await reload();
    } catch (error) {
      console.error("Failed to save category", error);
      toast.error("Nao foi possivel salvar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm("Deseja remover esta categoria?")) return;

    try {
      await removeCategory(categoryId);
      toast.success("Categoria removida");
      if (form.id === categoryId) {
        resetForm();
      }
      await reload();
    } catch (error) {
      console.error("Failed to delete category", error);
      toast.error("Nao foi possivel remover. Verifique se existem receitas vinculadas.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie categorias dinâmicas usadas no site e no editor.</p>
        </div>
        <Button type="button" variant="outline" onClick={resetForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Editar categoria" : "Nova categoria"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr,120px]">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Emoji</label>
              <Input value={form.emoji} onChange={(event) => setForm((current) => ({ ...current, emoji: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {form.id ? "Salvar alterações" : "Criar categoria"}
            </Button>
            {form.id && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar edição
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Carregando categorias...</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">/{category.slug}</p>
                  <h2 className="mt-2 text-lg font-semibold">
                    {category.emoji ? `${category.emoji} ` : ""}
                    {category.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{category.description || "Sem descrição"}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      setForm({
                        id: category.id,
                        name: category.name,
                        emoji: category.emoji || "",
                        description: category.description,
                      })
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive" onClick={() => void handleDelete(category.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
