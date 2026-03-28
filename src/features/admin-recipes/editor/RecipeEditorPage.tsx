import { Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessSection } from "@/features/admin-recipes/editor/components/AccessSection";
import { ContentSection } from "@/features/admin-recipes/editor/components/ContentSection";
import { IngredientsSection } from "@/features/admin-recipes/editor/components/IngredientsSection";
import { MediaSection } from "@/features/admin-recipes/editor/components/MediaSection";
import { SeoSection } from "@/features/admin-recipes/editor/components/SeoSection";
import { TeaserPreview } from "@/features/admin-recipes/editor/components/TeaserPreview";
import { useRecipeEditor } from "@/features/admin-recipes/editor/hooks/useRecipeEditor";

export default function RecipeEditorPage() {
  const {
    form,
    setField,
    handleTitleChange,
    handleImageSelect,
    handleRemoveImage,
    handleSave,
    loading,
    saving,
    uploadingImage,
    isEditing,
    isOffline,
    categories,
    errors,
    recipePublicUrl,
    teaserPreview,
    newCategoryOpen,
    setNewCategoryOpen,
    newCategoryName,
    setNewCategoryName,
    newCategoryDescription,
    setNewCategoryDescription,
    handleCreateCategory,
  } = useRecipeEditor();

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
            O formulário publica pela camada de API e repositórios, mantendo a UI isolada da persistência.
          </p>
          {isOffline && (
            <p className="mt-2 text-sm text-amber-700">
              Modo offline: apenas rascunhos locais estão liberados neste dispositivo.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => void handleSave("draft")}
            disabled={saving || uploadingImage}
          >
            <Save className="mr-2 h-4 w-4" /> Salvar rascunho
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => void handleSave("published")}
            disabled={saving || uploadingImage || isOffline}
          >
            <Globe className="mr-2 h-4 w-4" /> Publicar
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
        >
          <p className="text-sm font-semibold text-destructive">Revise os campos obrigatórios:</p>
          <ul className="list-disc pl-5 text-sm text-destructive">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContentSection
            form={form}
            categories={categories}
            recipePublicUrl={recipePublicUrl}
            isOffline={isOffline}
            saving={saving}
            uploadingImage={uploadingImage}
            newCategoryOpen={newCategoryOpen}
            newCategoryName={newCategoryName}
            newCategoryDescription={newCategoryDescription}
            onNewCategoryOpenChange={setNewCategoryOpen}
            onNewCategoryNameChange={setNewCategoryName}
            onNewCategoryDescriptionChange={setNewCategoryDescription}
            onCreateCategory={handleCreateCategory}
            onTitleChange={handleTitleChange}
            onFieldChange={setField}
          />

          <MediaSection
            form={form}
            isOffline={isOffline}
            uploadingImage={uploadingImage}
            onImageSelect={handleImageSelect}
            onRemoveImage={handleRemoveImage}
          />

          <AccessSection form={form} onFieldChange={setField} />

          <IngredientsSection form={form} onFieldChange={setField} />
        </CardContent>
      </Card>

      {form.accessTier === "paid" && <TeaserPreview teaser={teaserPreview} />}

      <SeoSection form={form} onFieldChange={setField} />
    </div>
  );
}
