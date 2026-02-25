import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, X, Plus, ClipboardPaste, AlertCircle, AlertTriangle, CheckCircle2, Globe, Save, DollarSign, Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getRecipeById, saveRecipe, isSlugTaken, generateSlug } from "@/lib/storage";
import { categories } from "@/lib/categories";
import { Recipe } from "@/types/recipe";

const empty: Partial<Recipe> = {
  title: "", slug: "", description: "", categorySlug: "salgadas",
  image: "", prepTime: 0, cookTime: 0, totalTime: 0, servings: 0,
  ingredients: [], instructions: [], tags: [], status: "draft",
  accessTier: "free",
};

export default function RecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState<Partial<Recipe>>(empty);
  const [tab, setTab] = useState("content");
  const [batchIng, setBatchIng] = useState("");
  const [batchStep, setBatchStep] = useState("");
  const [showBatchIng, setShowBatchIng] = useState(false);
  const [showBatchStep, setShowBatchStep] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (id) {
      const r = getRecipeById(id);
      if (r) { setForm(r); setTagsInput((r.tags || []).join(", ")); }
      else navigate("/admin/receitas");
    }
  }, [id]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleTitle = (title: string) => {
    set("title", title);
    if (!isEditing || !form.slug) set("slug", generateSlug(title));
  };

  // Validation
  const { errors, warnings } = useMemo(() => {
    const e: string[] = [];
    const w: string[] = [];
    if (!form.title) e.push("Título é obrigatório");
    if (!form.slug) e.push("Slug é obrigatório");
    if (form.slug && isSlugTaken(form.slug, form.id)) e.push("Slug já existe");
    if (!form.ingredients?.length) e.push("Adicione pelo menos 1 ingrediente");
    if (!form.instructions?.length) e.push("Adicione pelo menos 1 passo");
    if (form.accessTier === "paid" && (!form.priceCents || form.priceCents <= 0)) e.push("Receita paga precisa de preço");
    if (!form.description) w.push("Sem descrição (SEO fraco)");
    if (!form.image) w.push("Sem imagem");
    if ((form.ingredients?.length || 0) < 3) w.push("Poucos ingredientes");
    if ((form.instructions?.length || 0) < 2) w.push("Poucos passos");
    if (!form.prepTime && !form.cookTime) w.push("Sem tempo definido");
    if (!form.servings) w.push("Sem porções");
    if (form.accessTier === "paid" && !(form.teaserIngredients || []).length) w.push("Receita paga sem teaser de ingredientes");
    if (form.accessTier === "paid" && !(form.teaserInstructions || []).length) w.push("Receita paga sem teaser de instruções");
    return { errors: e, warnings: w };
  }, [form]);

  // List helpers
  const addItem = (key: "ingredients" | "instructions") => set(key, [...(form[key] || []), ""]);
  const updateItem = (key: "ingredients" | "instructions", i: number, v: string) => {
    const arr = [...(form[key] || [])];
    arr[i] = v;
    set(key, arr);
  };
  const removeItem = (key: "ingredients" | "instructions", i: number) => {
    set(key, (form[key] || []).filter((_, idx) => idx !== i));
  };
  const moveItem = (key: "ingredients" | "instructions", i: number, dir: -1 | 1) => {
    const arr = [...(form[key] || [])];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set(key, arr);
  };
  const batchAdd = (key: "ingredients" | "instructions", text: string) => {
    const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
    set(key, [...(form[key] || []), ...items]);
  };

  const handleSave = (publish = false) => {
    if (publish && errors.length > 0) return;
    const now = new Date().toISOString();
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const recipe: Recipe = {
      id: form.id || crypto.randomUUID(),
      title: form.title || "",
      slug: form.slug || "",
      description: form.description || "",
      categorySlug: form.categorySlug || "salgadas",
      image: form.image || "",
      prepTime: form.prepTime || 0,
      cookTime: form.cookTime || 0,
      totalTime: (form.prepTime || 0) + (form.cookTime || 0),
      servings: form.servings || 1,
      ingredients: form.ingredients || [],
      instructions: form.instructions || [],
      tags,
      status: publish ? "published" : "draft",
      accessTier: form.accessTier || "free",
      priceCents: form.priceCents,
      currency: form.currency || "BRL",
      teaserIngredients: form.teaserIngredients,
      teaserInstructions: form.teaserInstructions,
      createdAt: form.createdAt || now,
      updatedAt: now,
      publishedAt: publish ? (form.publishedAt || now) : form.publishedAt || null,
    };
    saveRecipe(recipe);
    navigate("/admin/receitas");
  };

  const renderList = (key: "ingredients" | "instructions", label: string, showBatch: boolean, setShowBatch: (v: boolean) => void, batchVal: string, setBatchVal: (v: string) => void) => (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowBatch(!showBatch)}>
            <ClipboardPaste className="mr-1 h-3.5 w-3.5" /> Colar em lote
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => addItem(key)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      </div>
      {showBatch && (
        <div className="mt-2 space-y-2 rounded-lg border bg-muted/50 p-3">
          <Textarea placeholder="Cole um item por linha..." value={batchVal} onChange={(e) => setBatchVal(e.target.value)} rows={4} />
          <Button type="button" size="sm" onClick={() => { batchAdd(key, batchVal); setBatchVal(""); setShowBatch(false); }}>
            Adicionar itens
          </Button>
        </div>
      )}
      <div className="mt-3 space-y-2">
        {(form[key] || []).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}</span>
            <Input value={item} onChange={(e) => updateItem(key, i, e.target.value)} className="flex-1" />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveItem(key, i, -1)} disabled={i === 0}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveItem(key, i, 1)} disabled={i === (form[key]?.length || 0) - 1}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(key, i)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-3xl font-bold">
        {isEditing ? "Editar Receita" : "Nova Receita"}
      </h1>

      {/* Validation bar */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="mt-4 space-y-2">
          {errors.map((e, i) => (
            <div key={`e${i}`} className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {e}
            </div>
          ))}
          {warnings.map((w, i) => (
            <div key={`w${i}`} className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="publish">Publicação</TabsTrigger>
        </TabsList>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => handleTitle(e.target.value)} placeholder="Ex: Bolo de Cenoura" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="bolo-de-cenoura" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Breve descrição da receita..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categorySlug} onValueChange={(v) => set("categorySlug", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.emoji} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imagem (URL)</Label>
              <Input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preparo (min)</Label>
              <Input type="number" value={form.prepTime || ""} onChange={(e) => set("prepTime", +e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cozimento (min)</Label>
              <Input type="number" value={form.cookTime || ""} onChange={(e) => set("cookTime", +e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Porções</Label>
              <Input type="number" value={form.servings || ""} onChange={(e) => set("servings", +e.target.value)} min="1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="rápido, fácil, brasileiro" />
          </div>

          <Separator />
          {renderList("ingredients", "Ingredientes", showBatchIng, setShowBatchIng, batchIng, setBatchIng)}
          <Separator />
          {renderList("instructions", "Modo de Preparo", showBatchStep, setShowBatchStep, batchStep, setBatchStep)}

          <Separator />

          {/* Monetização */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Monetização</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nível de Acesso</Label>
                <Select value={form.accessTier || "free"} onValueChange={(v) => set("accessTier", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">🔓 Grátis (Público)</SelectItem>
                    <SelectItem value="paid">🔒 Pago (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.accessTier === "paid" && (
                <div className="space-y-2">
                  <Label>Preço (centavos)</Label>
                  <Input
                    type="number"
                    value={form.priceCents || ""}
                    onChange={(e) => set("priceCents", +e.target.value)}
                    placeholder="990 = R$ 9,90"
                    min="100"
                  />
                  {form.priceCents ? (
                    <p className="text-xs text-muted-foreground">
                      = {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((form.priceCents || 0) / 100)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {form.accessTier === "paid" && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-semibold">Conteúdo de Teaser (preview público)</span>
                </div>
                <div className="space-y-2">
                  <Label>Ingredientes do Teaser (1 por linha)</Label>
                  <Textarea
                    value={(form.teaserIngredients || []).join("\n")}
                    onChange={(e) => set("teaserIngredients", e.target.value.split("\n").filter(Boolean))}
                    placeholder="Ex: Farinha, ovos, açúcar..."
                    rows={3}
                  />
                  {!(form.teaserIngredients || []).length && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Aviso: Sem teaser, o paywall só mostra o título.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Instruções do Teaser (1 por linha)</Label>
                  <Textarea
                    value={(form.teaserInstructions || []).join("\n")}
                    onChange={(e) => set("teaserInstructions", e.target.value.split("\n").filter(Boolean))}
                    placeholder="Ex: Comece misturando os ingredientes secos..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => handleSave(false)}>
              <Save className="mr-2 h-4 w-4" /> Salvar Rascunho
            </Button>
            <Button onClick={() => handleSave(true)} disabled={errors.length > 0}>
              <Globe className="mr-2 h-4 w-4" /> Publicar
            </Button>
          </div>
        </TabsContent>

        {/* SEO TAB */}
        <TabsContent value="seo" className="mt-6 space-y-6">
          <h2 className="font-heading text-xl font-semibold">Preview do Google</h2>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-lg text-blue-700">
              {form.title || "Título da receita"} | Receitas do Bell
            </p>
            <p className="text-sm text-green-700">
              receitasdobell.com.br/receitas/{form.slug || "slug-da-receita"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {form.description || "Adicione uma descrição para melhorar o SEO da sua receita."}
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>💡 Títulos com até 60 caracteres aparecem completos nos resultados.</p>
            <p>💡 Descrições com até 160 caracteres são ideais.</p>
            <p>💡 O Google pode usar ou não a description no snippet.</p>
            <p>
              <span className="font-medium">Título:</span> {(form.title || "").length}/60 caracteres
            </p>
            <p>
              <span className="font-medium">Descrição:</span> {(form.description || "").length}/160 caracteres
            </p>
          </div>
        </TabsContent>

        {/* PUBLISH TAB */}
        <TabsContent value="publish" className="mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status atual:</span>
            <Badge variant={form.status === "published" ? "default" : "secondary"}>
              {form.status === "published" ? "Publicada" : "Rascunho"}
            </Badge>
          </div>

          <div>
            <h3 className="font-heading text-lg font-semibold">
              {errors.length === 0 ? (
                <span className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" /> Pronta para publicar!
                </span>
              ) : (
                <span className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" /> Corrija os erros antes de publicar
                </span>
              )}
            </h3>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Checklist</h4>
            {errors.map((e, i) => (
              <div key={`e${i}`} className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {e}
              </div>
            ))}
            {warnings.map((w, i) => (
              <div key={`w${i}`} className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle className="h-4 w-4" /> {w}
              </div>
            ))}
            {errors.length === 0 && warnings.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> Tudo certo!
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => handleSave(true)} disabled={errors.length > 0} className="gap-2">
              <Globe className="h-4 w-4" /> Publicar com 1 clique
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} className="gap-2">
              <Save className="h-4 w-4" /> Salvar como Rascunho
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
