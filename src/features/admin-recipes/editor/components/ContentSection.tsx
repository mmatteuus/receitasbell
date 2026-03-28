import type { Category } from "@/types/category";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewCategoryDialog } from "@/components/admin/NewCategoryDialog";
import type { EditorState } from "../schema";

type ContentSectionProps = {
  form: EditorState;
  categories: Category[];
  recipePublicUrl: string;
  isOffline: boolean;
  saving: boolean;
  uploadingImage: boolean;
  newCategoryOpen: boolean;
  newCategoryName: string;
  newCategoryDescription: string;
  onNewCategoryOpenChange: (open: boolean) => void;
  onNewCategoryNameChange: (value: string) => void;
  onNewCategoryDescriptionChange: (value: string) => void;
  onCreateCategory: () => void;
  onTitleChange: (value: string) => void;
  onFieldChange: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
};

export function ContentSection({
  form,
  categories,
  recipePublicUrl,
  isOffline,
  saving,
  uploadingImage,
  newCategoryOpen,
  newCategoryName,
  newCategoryDescription,
  onNewCategoryOpenChange,
  onNewCategoryNameChange,
  onNewCategoryDescriptionChange,
  onCreateCategory,
  onTitleChange,
  onFieldChange,
}: ContentSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input value={form.title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Ex: Bolo de Cenoura" />
      </div>

      <div className="space-y-2">
        <Label>URL da receita</Label>
        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {recipePublicUrl}
        </div>
        <p className="text-xs text-muted-foreground">
          O slug é gerado a partir do título e fica fixo após a primeira publicação.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={form.description} onChange={(event) => onFieldChange("description", event.target.value)} rows={3} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={form.categorySlug} onValueChange={(value) => onFieldChange("categorySlug", value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NewCategoryDialog
              open={newCategoryOpen}
              onOpenChange={onNewCategoryOpenChange}
              name={newCategoryName}
              description={newCategoryDescription}
              onNameChange={onNewCategoryNameChange}
              onDescriptionChange={onNewCategoryDescriptionChange}
              onCreate={onCreateCategory}
              disabled={saving || uploadingImage || isOffline}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Preparo (min)</Label>
          <Input type="number" value={form.prepTime} onChange={(event) => onFieldChange("prepTime", Number(event.target.value || 0))} />
        </div>
        <div className="space-y-2">
          <Label>Cozimento (min)</Label>
          <Input type="number" value={form.cookTime} onChange={(event) => onFieldChange("cookTime", Number(event.target.value || 0))} />
        </div>
        <div className="space-y-2">
          <Label>Porções</Label>
          <Input type="number" min={1} value={form.servings} onChange={(event) => onFieldChange("servings", Number(event.target.value || 1))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Dificuldade</Label>
          <Select value={form.difficulty || "none"} onValueChange={(value) => onFieldChange("difficulty", value === "none" ? null : (value as EditorState["difficulty"]))}>
            <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Opcional</SelectItem>
              <SelectItem value="Fácil">Fácil</SelectItem>
              <SelectItem value="Médio">Médio</SelectItem>
              <SelectItem value="Difícil">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Calorias (kcal)</Label>
          <Input type="number" placeholder="Ex: 350" value={form.calories || ""} onChange={(e) => onFieldChange("calories", e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div className="space-y-2">
          <Label>Vídeo (YouTube/TikTok)</Label>
          <Input type="url" placeholder="https://..." value={form.videoUrl} onChange={(e) => onFieldChange("videoUrl", e.target.value)} />
        </div>
      </div>
    </>
  );
}
