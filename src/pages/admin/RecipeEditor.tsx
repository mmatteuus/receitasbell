import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, X, Plus, ClipboardPaste, AlertCircle, AlertTriangle, CheckCircle2, Globe, Save, DollarSign, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getRecipeById, saveRecipe, uniqueSlug } from "@/lib/storage";
import { getCategories, addCategory } from "@/lib/categories";
import { Recipe } from "@/types/recipe";

const empty: Partial<Recipe> = {
  title: "", slug: "", description: "", categorySlug: "salgadas",
  image: "", imageUrl: "", imageDataUrl: "",
  prepTime: 0, cookTime: 0, totalTime: 0, servings: 0,
  fullIngredients: [], fullInstructions: [], tags: [], status: "draft",
  accessTier: "free",
};

function compressImage(file: File, maxWidth = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<Recipe>>(empty);
  const [tab, setTab] = useState("content");
  const [batchIng, setBatchIng] = useState("");
  const [batchStep, setBatchStep] = useState("");
  const [showBatchIng, setShowBatchIng] = useState(false);
  const [showBatchStep, setShowBatchStep] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [categories, setCats] = useState(getCategories);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  useEffect(() => {
    if (id) {
      const r = getRecipeById(id);
      if (r) {
        setForm(r);
        setTagsInput((r.tags || []).join(", "));
        if (r.priceBRL) {
          setPriceDisplay(r.priceBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
      } else navigate("/admin/receitas");
    }
  }, [id, navigate]);

  const set = <K extends keyof Recipe>(k: K, v: Recipe[K] | undefined) => setForm((p) => ({ ...p, [k]: v }));

  const handleTitle = (title: string) => {
    set("title", title);
    // Only auto-generate slug for drafts or new recipes
    if (!isEditing || form.status !== "published") {
      set("slug", uniqueSlug(title, form.id));
    }
  };

  const handlePriceChange = (raw: string) => {
    setPriceDisplay(raw);
    const parsed = parseFloat(raw.replace(",", "."));
    if (!isNaN(parsed)) {
      set("priceBRL", Math.round(parsed * 100) / 100);
    } else if (raw === "") {
      set("priceBRL", undefined);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      set("image", dataUrl);
      set("imageDataUrl", dataUrl);
      set("imageUrl", "");
    } catch (err) {
      console.error("Failed to compress image", err);
    }
  };

  const handleNewCategory = () => {
    if (!newCatName.trim()) return;
    const cat = addCategory({ name: newCatName.trim(), emoji: newCatEmoji || "📁", description: newCatDesc });
    setCats(getCategories());
    set("categorySlug", cat.slug);
    setNewCatName(""); setNewCatEmoji(""); setNewCatDesc("");
    setNewCatOpen(false);
  };

  // Validation
  const { errors, warnings } = useMemo(() => {
    const e: string[] = [];
    const w: string[] = [];
    if (!form.title) e.push("Título é obrigatório");
    if (!form.fullIngredients?.length) e.push("Adicione pelo menos 1 ingrediente");
    if (!form.fullInstructions?.length) e.push("Adicione pelo menos 1 passo");
    if (form.accessTier === "paid" && (!form.priceBRL || form.priceBRL <= 0)) e.push("Receita paga precisa de preço");
    if (!form.description) w.push("Sem descrição (SEO fraco)");
    if (!form.image) w.push("Sem imagem");
    if ((form.fullIngredients?.length || 0) < 3) w.push("Poucos ingredientes");
    if ((form.fullInstructions?.length || 0) < 2) w.push("Poucos passos");
    if (!form.prepTime && !form.cookTime) w.push("Sem tempo definido");
    if (!form.servings) w.push("Sem porções");
    return { errors: e, warnings: w };
  }, [form]);

  // List helpers
  type ListKey = "fullIngredients" | "fullInstructions";
  const addItem = (key: ListKey) => set(key, [...(form[key] || []), ""]);
  const updateItem = (key: ListKey, i: number, v: string) => {
    const arr = [...(form[key] || [])];
    arr[i] = v;
    set(key, arr);
  };
  const removeItem = (key: ListKey, i: number) => {
    set(key, (form[key] || []).filter((_, idx) => idx !== i));
  };
  const moveItem = (key: ListKey, i: number, dir: -1 | 1) => {
    const arr = [...(form[key] || [])];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set(key, arr);
  };
  const batchAdd = (key: ListKey, text: string) => {
    const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
    set(key, [...(form[key] || []), ...items]);
  };

  const handleSave = (publish = false) => {
    if (publish && errors.length > 0) return;
    const now = new Date().toISOString();
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const slug = form.slug || uniqueSlug(form.title || "receita", form.id);
    const hasDataImage = Boolean(form.imageDataUrl);
    const remoteImage = form.imageUrl || (!hasDataImage && form.image ? form.image : undefined);
    const imageUrl = hasDataImage ? form.imageUrl || undefined : remoteImage;
    const imageDataUrl = hasDataImage ? form.imageDataUrl : undefined;
    const recipe: Recipe = {
      id: form.id || crypto.randomUUID(),
      title: form.title || "",
      slug,
      description: form.description || "",
      categorySlug: form.categorySlug || "salgadas",
      image: form.imageDataUrl || remoteImage || "",
      imageUrl,
      imageDataUrl,
      prepTime: form.prepTime || 0,
      cookTime: form.cookTime || 0,
      totalTime: (form.prepTime || 0) + (form.cookTime || 0),
      servings: form.servings || 1,
      fullIngredients: form.fullIngredients || [],
      fullInstructions: form.fullInstructions || [],
      tags,
      status: publish ? "published" : "draft",
      accessTier: form.accessTier || "free",
      priceBRL: form.accessTier === "paid" ? form.priceBRL : undefined,
      createdAt: form.createdAt || now,
      updatedAt: now,
      publishedAt: publish ? (form.publishedAt || now) : form.publishedAt || null,
    };
    saveRecipe(recipe);
    navigate("/admin/receitas");
  };

  const renderList = (key: ListKey, label: string, showBatch: boolean, setShowBatch: (v: boolean) => void, batchVal: string, setBatchVal: (v: string) => void) => (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-base font-semibold">{label}</Label>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowBatch(!showBatch)}>
            <ClipboardPaste className="mr-1 h-3.5 w-3.5" /> <span className="hidden sm:inline">Colar em lote</span>
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
          <div key={i} className="flex items-center gap-1 sm:gap-2">
            <span className="w-5 text-center text-xs text-muted-foreground sm:w-6">{i + 1}</span>
            <Input value={item} onChange={(e) => updateItem(key, i, e.target.value)} className="flex-1 text-sm" />
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => moveItem(key, i, -1)} disabled={i === 0}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => moveItem(key, i, 1)} disabled={i === (form[key]?.length || 0) - 1}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive sm:h-8 sm:w-8" onClick={() => removeItem(key, i)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">
        {isEditing ? "Editar Receita" : "Nova Receita"}
      </h1>

      {/* Validation bar */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="mt-4 space-y-2">
          {errors.map((e, i) => (
            <div key={`e${i}`} className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {e}
            </div>
          ))}
          {warnings.map((w, i) => (
            <div key={`w${i}`} className="flex items-center gap-2 rounded-lg bg-orange-100/50 dark:bg-orange-900/20 px-3 py-2 text-sm text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {w}
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
          {/* Title + auto slug */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => handleTitle(e.target.value)} placeholder="Ex: Bolo de Cenoura" />
            {form.slug && (
              <p className="text-xs text-muted-foreground">
                URL: <code className="rounded bg-muted px-1">/receitas/{form.slug}</code>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Breve descrição da receita..." />
          </div>

          {/* Category + new category dialog */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex gap-2">
                <Select value={form.categorySlug} onValueChange={(v) => set("categorySlug", v)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.emoji} {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Nome</Label>
                        <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Ex: Sopas" />
                      </div>
                      <div className="space-y-1">
                        <Label>Emoji (opcional)</Label>
                        <Input value={newCatEmoji} onChange={(e) => setNewCatEmoji(e.target.value)} placeholder="🍲" maxLength={4} />
                      </div>
                      <div className="space-y-1">
                        <Label>Descrição (opcional)</Label>
                        <Input value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} placeholder="Sopas e caldos" />
                      </div>
                      <Button onClick={handleNewCategory} disabled={!newCatName.trim()} className="w-full">Criar Categoria</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Imagem</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {form.image ? (
                <div className="relative">
                  <img src={form.image} alt="Preview" className="h-32 w-full rounded-lg border object-cover sm:h-40" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={() => set("image", "")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 sm:h-40 border-dashed gap-2 flex-col"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para enviar imagem</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
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
          {renderList("fullIngredients", "Ingredientes", showBatchIng, setShowBatchIng, batchIng, setBatchIng)}
          <Separator />
          {renderList("fullInstructions", "Modo de Preparo", showBatchStep, setShowBatchStep, batchStep, setBatchStep)}
          <Separator />

          {/* Monetization */}
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
                  <Label>Preço (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={priceDisplay}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="9,90"
                      className="pl-9"
                    />
                  </div>
                  {form.priceBRL ? (
                    <p className="text-xs text-muted-foreground">
                      = {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(form.priceBRL)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            {form.accessTier === "paid" && (
              <p className="text-xs text-muted-foreground rounded-lg border bg-muted/30 p-3">
                ℹ️ O teaser é automático: exibirá os 2 primeiros ingredientes e os 2 primeiros passos para quem ainda não comprou.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => handleSave(false)} className="gap-2">
              <Save className="h-4 w-4" /> Salvar Rascunho
            </Button>
            <Button onClick={() => handleSave(true)} disabled={errors.length > 0} className="gap-2">
              <Globe className="h-4 w-4" /> Publicar
            </Button>
          </div>
        </TabsContent>

        {/* SEO TAB */}
        <TabsContent value="seo" className="mt-6 space-y-6">
          <h2 className="font-heading text-lg font-semibold sm:text-xl">Preview do Google</h2>
          <div className="overflow-hidden rounded-lg border bg-card p-4 sm:p-6">
            <p className="text-base text-blue-700 sm:text-lg truncate">
              {form.title || "Título da receita"} | Receitas do Bell
            </p>
            <p className="text-sm text-green-700 truncate">
              receitasdobell.com.br/receitas/{form.slug || "slug-da-receita"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {form.description || "Adicione uma descrição para melhorar o SEO da sua receita."}
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>💡 Títulos com até 60 caracteres aparecem completos nos resultados.</p>
            <p>💡 Descrições com até 160 caracteres são ideais.</p>
            <p><span className="font-medium">Título:</span> {(form.title || "").length}/60 caracteres</p>
            <p><span className="font-medium">Descrição:</span> {(form.description || "").length}/160 caracteres</p>
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
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
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
              <div key={`w${i}`} className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4" /> {w}
              </div>
            ))}
            {errors.length === 0 && warnings.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Tudo certo!
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4 sm:flex-row">
            <Button onClick={() => handleSave(true)} disabled={errors.length > 0} className="gap-2">
              <Globe className="h-4 w-4" /> Publicar
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
