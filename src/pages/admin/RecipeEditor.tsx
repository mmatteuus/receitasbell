import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Save, Globe, AlertCircle, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecipeById, getRecipes, removeRecipeImageFile, saveRecipe, uniqueSlug, uploadRecipeImageFile } from "@/lib/repos/recipeRepo";
import { addCategory } from "@/lib/repos/categoryRepo";
import { useAppContext } from "@/contexts/app-context";
import type { AccessTier, ImageFileMeta, Recipe, RecipeStatus } from "@/types/recipe";
import { normalizeBRLInput, parseBRLInput } from "@/lib/helpers";
import { createImagePreview, revokeImagePreview } from "@/lib/services/storageFallback";
import { toast } from "sonner";

type EditorState = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageFileMeta: ImageFileMeta | null;
  imagePreviewUrl: string;
  categorySlug: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  accessTier: AccessTier;
  priceBRL: number | null;
  priceInput: string;
  ingredientsText: string;
  instructionsText: string;
  tagsText: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  status: RecipeStatus;
  createdAt?: string;
  publishedAt?: string | null;
};

const EMPTY_STATE: EditorState = {
  title: "",
  slug: "",
  description: "",
  imageUrl: "",
  imageFileMeta: null,
  imagePreviewUrl: "",
  categorySlug: "salgadas",
  prepTime: 0,
  cookTime: 0,
  servings: 1,
  accessTier: "free",
  priceBRL: null,
  priceInput: "",
  ingredientsText: "",
  instructionsText: "",
  tagsText: "",
  excerpt: "",
  seoTitle: "",
  seoDescription: "",
  isFeatured: false,
  status: "draft",
};

function mapRecipeToState(recipe: Recipe): EditorState {
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    imageUrl: recipe.imageUrl || recipe.image || "",
    imageFileMeta: recipe.imageFileMeta ?? null,
    imagePreviewUrl: recipe.imageUrl || recipe.image || "",
    categorySlug: recipe.categorySlug,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    accessTier: recipe.accessTier,
    priceBRL: recipe.priceBRL ?? null,
    priceInput: recipe.priceBRL ? normalizeBRLInput(recipe.priceBRL) : "",
    ingredientsText: recipe.fullIngredients.join("\n"),
    instructionsText: recipe.fullInstructions.join("\n"),
    tagsText: recipe.tags.join(", "),
    excerpt: recipe.excerpt || "",
    seoTitle: recipe.seoTitle || "",
    seoDescription: recipe.seoDescription || "",
    isFeatured: Boolean(recipe.isFeatured),
    status: recipe.status,
    createdAt: recipe.createdAt,
    publishedAt: recipe.publishedAt ?? null,
  };
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function RecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { categories, refreshCategories } = useAppContext();
  const [form, setForm] = useState<EditorState>(EMPTY_STATE);
  const [existingRecipes, setExistingRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  useEffect(() => {
    async function loadEditor() {
      setLoading(true);
      try {
        const recipes = await getRecipes();
        setExistingRecipes(recipes);

        if (id) {
          const recipe = await getRecipeById(id);
          if (!recipe) {
            navigate("/admin/receitas");
            return;
          }
          setForm(mapRecipeToState(recipe));
        } else {
          setForm(EMPTY_STATE);
        }
      } catch (error) {
        console.error("Failed to load recipe editor", error);
        toast.error("Nao foi possivel carregar o editor.");
      } finally {
        setLoading(false);
      }
    }

    void loadEditor();
  }, [id, navigate]);

  const errors = useMemo(() => {
    const next: string[] = [];
    if (!form.title.trim()) next.push("Título é obrigatório");
    if (!form.imageUrl.trim()) next.push("Imagem é obrigatória");
    if (!parseLines(form.ingredientsText).length) next.push("Adicione pelo menos 1 ingrediente");
    if (!parseLines(form.instructionsText).length) next.push("Adicione pelo menos 1 passo");
    if (form.accessTier === "paid" && (!parseBRLInput(form.priceInput) || parseBRLInput(form.priceInput)! <= 0)) {
      next.push("Receita paga precisa de preço");
    }
    return next;
  }, [form]);

  function setField<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: current.publishedAt ? current.slug : uniqueSlug(title, existingRecipes, current.id),
    }));
  }

  async function handleImageSelect(file: File | null) {
    if (!file) {
      return;
    }

    const previousImageMeta = form.imageFileMeta;
    const localPreviewUrl = createImagePreview(file);
    setUploadingImage(true);
    setForm((current) => ({
      ...current,
      imagePreviewUrl: localPreviewUrl,
    }));

    try {
      const uploaded = await uploadRecipeImageFile(file);
      setForm((current) => ({
        ...current,
        imageUrl: uploaded.imageUrl,
        imageFileMeta: uploaded.imageFileMeta,
        imagePreviewUrl: uploaded.imageUrl,
      }));
      revokeImagePreview(localPreviewUrl);
      if (previousImageMeta?.storage === "google_drive" && previousImageMeta.fileId !== uploaded.imageFileMeta.fileId) {
        await removeRecipeImageFile(previousImageMeta);
      }
      toast.success("Imagem enviada");
    } catch (error) {
      console.error("Failed to upload image", error);
      revokeImagePreview(localPreviewUrl);
      setForm((current) => ({
        ...current,
        imagePreviewUrl: current.imageUrl,
      }));
      toast.error("Nao foi possivel enviar a imagem.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    try {
      await removeRecipeImageFile(form.imageFileMeta);
    } catch (error) {
      console.error("Failed to delete image", error);
    }

    setForm((current) => ({
      ...current,
      imageUrl: "",
      imageFileMeta: null,
      imagePreviewUrl: "",
    }));
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;

    try {
      const category = await addCategory({
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji.trim() || "📁",
        description: newCategoryDescription.trim(),
      });
      await refreshCategories();
      setField("categorySlug", category.slug);
      setNewCategoryName("");
      setNewCategoryEmoji("");
      setNewCategoryDescription("");
      setNewCategoryOpen(false);
      toast.success("Categoria criada");
    } catch (error) {
      console.error("Failed to create category", error);
      toast.error("Nao foi possivel criar a categoria.");
    }
  }

  async function handleSave(status: RecipeStatus) {
    if (errors.length) {
      toast.error("Revise os campos obrigatórios antes de salvar.");
      return;
    }

    setSaving(true);
    try {
      const parsedPrice = parseBRLInput(form.priceInput);
      const nextSlug = form.publishedAt ? form.slug : uniqueSlug(form.title, existingRecipes, form.id);
      await saveRecipe({
        id: form.id,
        title: form.title.trim(),
        slug: nextSlug,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        imageFileMeta: form.imageFileMeta,
        categorySlug: form.categorySlug,
        prepTime: Number(form.prepTime || 0),
        cookTime: Number(form.cookTime || 0),
        servings: Number(form.servings || 1),
        accessTier: form.accessTier,
        priceBRL: form.accessTier === "paid" ? parsedPrice : null,
        fullIngredients: parseLines(form.ingredientsText),
        fullInstructions: parseLines(form.instructionsText),
        tags: form.tagsText.split(",").map((item) => item.trim()).filter(Boolean),
        excerpt: form.excerpt.trim(),
        seoTitle: form.seoTitle.trim(),
        seoDescription: form.seoDescription.trim(),
        isFeatured: form.isFeatured,
        status,
        createdAt: form.createdAt,
        publishedAt: status === "published" ? form.publishedAt || new Date().toISOString() : form.publishedAt ?? null,
      });
      toast.success(status === "published" ? "Receita publicada" : "Rascunho salvo");
      navigate("/admin/receitas");
    } catch (error) {
      console.error("Failed to save recipe", error);
      toast.error("Nao foi possivel salvar a receita.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando editor...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            {isEditing ? "Editar Receita" : "Nova Receita"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            As alterações são salvas diretamente no Google Sheets via Vercel Functions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void handleSave("draft")} disabled={saving || uploadingImage}>
            <Save className="mr-2 h-4 w-4" /> Salvar rascunho
          </Button>
          <Button onClick={() => void handleSave("published")} disabled={saving || uploadingImage}>
            <Globe className="mr-2 h-4 w-4" /> Publicar
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error) => (
            <div key={error} className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(event) => handleTitleChange(event.target.value)} placeholder="Ex: Bolo de Cenoura" />
          </div>

          <div className="space-y-2">
            <Label>Slug automático</Label>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              /{form.publishedAt ? form.slug : uniqueSlug(form.title || "receita", existingRecipes, form.id)}
            </div>
            <p className="text-xs text-muted-foreground">O slug é gerado a partir do título e fica fixo após a primeira publicação.</p>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex gap-2">
                <Select value={form.categorySlug} onValueChange={(value) => setField("categorySlug", value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.emoji} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Nova Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Nome" />
                      <Input value={newCategoryEmoji} onChange={(event) => setNewCategoryEmoji(event.target.value)} placeholder="Emoji" maxLength={4} />
                      <Input value={newCategoryDescription} onChange={(event) => setNewCategoryDescription(event.target.value)} placeholder="Descrição" />
                      <Button onClick={() => void handleCreateCategory()} className="w-full">Criar categoria</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagem da receita</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={(event) => void handleImageSelect(event.target.files?.[0] || null)}
                />
                <Button type="button" variant="outline" disabled={!form.imageUrl || uploadingImage} onClick={() => void handleRemoveImage()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A imagem é enviada para storage externo e o Google Sheets guarda apenas URL e metadados.
              </p>
            </div>
          </div>

          {(form.imagePreviewUrl || form.imageUrl) && (
            <div className="overflow-hidden rounded-xl border">
              <img src={form.imagePreviewUrl || form.imageUrl} alt="Preview" className="h-56 w-full object-cover" />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Preparo (min)</Label>
              <Input type="number" value={form.prepTime} onChange={(event) => setField("prepTime", Number(event.target.value || 0))} />
            </div>
            <div className="space-y-2">
              <Label>Cozimento (min)</Label>
              <Input type="number" value={form.cookTime} onChange={(event) => setField("cookTime", Number(event.target.value || 0))} />
            </div>
            <div className="space-y-2">
              <Label>Porções</Label>
              <Input type="number" min={1} value={form.servings} onChange={(event) => setField("servings", Number(event.target.value || 1))} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Acesso</Label>
              <Select value={form.accessTier} onValueChange={(value) => setField("accessTier", value as AccessTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Grátis</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={form.priceInput}
                disabled={form.accessTier !== "paid"}
                onChange={(event) => setField("priceInput", event.target.value)}
                onBlur={() => setField("priceInput", normalizeBRLInput(form.priceInput))}
                placeholder="7,90"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={form.tagsText} onChange={(event) => setField("tagsText", event.target.value)} placeholder="rápido, fácil, premium" />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Ingredientes</Label>
            <Textarea
              value={form.ingredientsText}
              onChange={(event) => setField("ingredientsText", event.target.value)}
              rows={8}
              placeholder="Um ingrediente por linha"
            />
          </div>

          <div className="space-y-2">
            <Label>Modo de preparo</Label>
            <Textarea
              value={form.instructionsText}
              onChange={(event) => setField("instructionsText", event.target.value)}
              rows={10}
              placeholder="Um passo por linha"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO e publicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resumo</Label>
            <Textarea value={form.excerpt} onChange={(event) => setField("excerpt", event.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>SEO title</Label>
            <Input value={form.seoTitle} onChange={(event) => setField("seoTitle", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>SEO description</Label>
            <Textarea value={form.seoDescription} onChange={(event) => setField("seoDescription", event.target.value)} rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant={form.isFeatured ? "default" : "outline"} onClick={() => setField("isFeatured", !form.isFeatured)}>
              {form.isFeatured ? "Em destaque" : "Marcar como destaque"}
            </Button>
            <Badge variant={form.status === "published" ? "default" : "secondary"}>
              {form.status === "published" ? "Publicado" : "Rascunho"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
