import { useEffect, useState } from 'react';
import { Pencil, PlusCircle, Trash2, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addCategory, editCategory, getCategories, removeCategory } from '@/lib/repos/categoryRepo';
import type { Category } from '@/types/category';
import { useAppContext } from '@/contexts/app-context';
import { toast } from 'sonner';
import { PageHead } from '@/components/PageHead';

type FormState = {
  id?: string;
  name: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
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
        console.error('Failed to load categories', error);
        toast.error('Nao foi possivel carregar as categorias.');
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
      toast.error('Informe o nome da categoria.');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await editCategory(form.id, form);
        toast.success('Categoria atualizada');
      } else {
        await addCategory(form);
        toast.success('Categoria criada');
      }
      resetForm();
      await reload();
    } catch (error) {
      console.error('Failed to save category', error);
      toast.error('Nao foi possivel salvar a categoria.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm('Deseja remover esta categoria?')) return;

    try {
      await removeCategory(categoryId);
      toast.success('Categoria removida');
      if (form.id === categoryId) {
        resetForm();
      }
      await reload();
    } catch (error) {
      console.error('Failed to delete category', error);
      toast.error('Nao foi possivel remover. Verifique se existem receitas vinculadas.');
    }
  }

  return (
    <>
      <PageHead
        title="Categorias"
        description="Gerencie categorias dinâmicas usadas no site e no editor."
        noindex={true}
      />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Categorias</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie categorias dinâmicas usadas no site e no editor.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={resetForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova categoria
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{form.id ? 'Editar categoria' : 'Nova categoria'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => void handleSubmit()} disabled={saving}>
                {form.id ? 'Salvar alterações' : 'Criar categoria'}
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
            <CardContent className="p-6 text-sm text-muted-foreground">
              Carregando categorias...
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
              >
                <CardContent className="p-0">
                  <div className="flex h-full flex-col">
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider bg-muted/30"
                            >
                              /{category.slug}
                            </Badge>
                          </div>
                          <h2 className="mt-2 text-xl font-bold tracking-tight">{category.name}</h2>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Layers className="h-5 w-5" />
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                        {category.description || 'Nenhuma descrição informada para esta categoria.'}
                      </p>
                    </div>

                    <div className="flex border-t bg-muted/20 divide-x transition-colors group-hover:bg-muted/30">
                      <Button
                        variant="ghost"
                        className="flex-1 rounded-none h-11 gap-2 text-xs font-medium"
                        onClick={() =>
                          setForm({
                            id: String(category.id),
                            name: category.name,
                            description: category.description || '',
                          })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 rounded-none h-11 gap-2 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => void handleDelete(String(category.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
