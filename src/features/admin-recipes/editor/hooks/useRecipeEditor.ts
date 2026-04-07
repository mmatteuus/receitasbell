import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { RecipeRecord } from '@/lib/recipes/types';
import type { RecipeStatus } from '@/types/recipe';
import {
  getRecipeTeaser,
  getRecipes,
  removeRecipeImageFile,
  saveRecipe,
  uniqueSlug,
  uploadRecipeImageFile,
} from '@/lib/repos/recipeRepo';
import { addCategory } from '@/lib/repos/categoryRepo';
import { useAppContext } from '@/contexts/app-context';
import { normalizeBRLInput, parseBRLInput } from '@/lib/helpers';
import { createImagePreview, revokeImagePreview } from '@/lib/services/storageFallback';
import { toast } from 'sonner';
import { buildTenantAdminPath, getCurrentTenantSlug } from '@/lib/tenant';
import {
  loadAdminRecipeForEditor,
  saveAdminRecipeDraftLocal,
} from '@/pwa/offline/repos/admin-recipes-offline-repo';
import { logger } from '@/lib/logger';
import {
  EMPTY_STATE,
  type EditorState,
  getEditorErrors,
  parseLines,
  type RecipeDraftInput,
} from '../schema';

function mapRecipeToState(recipe: RecipeDraftInput): EditorState {
  return {
    ...EMPTY_STATE,
    id: recipe.serverRecipeId || recipe.id,
    localDraftId: recipe.draftId,
    title: recipe.title || '',
    slug: recipe.slug || '',
    description: recipe.description || '',
    imageUrl: recipe.imageUrl || '',
    imageFileMeta: recipe.imageFileMeta ?? null,
    imagePreviewUrl: recipe.imageUrl || '',
    categorySlug: recipe.categorySlug || '',
    prepTime: recipe.prepTime || 0,
    cookTime: recipe.cookTime || 0,
    servings: recipe.servings || 1,
    difficulty: recipe.difficulty ?? null,
    calories: recipe.calories ?? null,
    videoUrl: recipe.videoUrl || '',
    accessTier: recipe.accessTier || 'free',
    priceBRL: recipe.priceBRL ?? null,
    priceInput: typeof recipe.priceBRL === 'number' ? normalizeBRLInput(recipe.priceBRL) : '',
    ingredientsText: (recipe.fullIngredients || []).join('\n'),
    instructionsText: (recipe.fullInstructions || []).join('\n'),
    tagsText: (recipe.tags || []).join(', '),
    excerpt: recipe.excerpt || '',
    seoTitle: recipe.seoTitle || '',
    seoDescription: recipe.seoDescription || '',
    isFeatured: Boolean(recipe.isFeatured),
    status: recipe.status || 'draft',
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    publishedAt: recipe.publishedAt ?? null,
  };
}

export function useRecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const tenantSlug = getCurrentTenantSlug(location.pathname);
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isEditing = Boolean(id);
  const { categories, refreshCategories } = useAppContext();
  const [form, setForm] = useState<EditorState>(EMPTY_STATE);
  const [existingRecipes, setExistingRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  useEffect(() => {
    async function loadEditor() {
      setLoading(true);
      try {
        try {
          const recipes = await getRecipes();
          setExistingRecipes(recipes);
        } catch (error) {
          logger.error('recipe-editor-recipes', error);
          setExistingRecipes([]);
        }

        if (id) {
          const recipe = await loadAdminRecipeForEditor(id);
          if (!recipe) {
            navigate(buildTenantAdminPath('receitas', tenantSlug));
            return;
          }
          setForm(mapRecipeToState(recipe));
        } else {
          setForm(EMPTY_STATE);
        }
      } catch (error) {
        logger.error('recipe-editor-load', error);
        toast.error('Nao foi possivel carregar o editor.');
      } finally {
        setLoading(false);
      }
    }

    void loadEditor();
  }, [id, navigate, tenantSlug]);

  useEffect(() => {
    if (loading || form.categorySlug || categories.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      categorySlug: current.categorySlug || categories[0]?.slug || '',
    }));
  }, [categories, form.categorySlug, loading]);

  const automaticSlug = useMemo(
    () =>
      form.publishedAt ? form.slug : uniqueSlug(form.title || 'receita', existingRecipes, form.id),
    [existingRecipes, form.id, form.publishedAt, form.slug, form.title]
  );

  const recipePublicPath = automaticSlug ? `/receitas/${automaticSlug}` : '/receitas/receita';
  const recipePublicUrl =
    typeof window === 'undefined'
      ? recipePublicPath
      : `${window.location.origin}${recipePublicPath}`;

  const teaserPreview = useMemo(
    () =>
      getRecipeTeaser({
        fullIngredients: parseLines(form.ingredientsText),
        fullInstructions: parseLines(form.instructionsText),
      }),
    [form.ingredientsText, form.instructionsText]
  );

  const errors = useMemo(() => getEditorErrors(form), [form]);

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
    if (isOffline) {
      toast.error('Upload de imagem offline não está disponível.');
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
      if (
        previousImageMeta?.storage === 'external' &&
        previousImageMeta.fileId !== uploaded.imageFileMeta.fileId
      ) {
        await removeRecipeImageFile(previousImageMeta);
      }
      toast.success('Imagem enviada');
    } catch (error) {
      logger.error('recipe-editor-upload', error);
      revokeImagePreview(localPreviewUrl);
      setForm((current) => ({
        ...current,
        imagePreviewUrl: current.imageUrl,
      }));
      toast.error('Nao foi possivel enviar a imagem.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    if (isOffline) {
      toast.error('Remoção de imagem offline não está disponível.');
      return;
    }

    try {
      await removeRecipeImageFile(form.imageFileMeta);
    } catch (error) {
      logger.error('recipe-editor-remove-image', error);
    }

    setForm((current) => ({
      ...current,
      imageUrl: '',
      imageFileMeta: null,
      imagePreviewUrl: '',
    }));
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    if (isOffline) {
      toast.error('Criação de categoria offline não está disponível.');
      return;
    }

    try {
      const category = await addCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        icon: newCategoryIcon.trim() || undefined,
      });
      await refreshCategories();
      setField('categorySlug', category.slug);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryIcon('');
      setNewCategoryOpen(false);
      toast.success('Categoria criada');
    } catch (error) {
      logger.error('recipe-editor-category', error);
      toast.error('Nao foi possivel criar a categoria.');
    }
  }

  async function handleSave(status: RecipeStatus) {
    if (isOffline && status === 'published') {
      toast.error('Publicação offline não está disponível.');
      return;
    }

    if (!isOffline && errors.length) {
      toast.error('Revise os campos obrigatórios antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const parsedPrice = parseBRLInput(form.priceInput);
      const nextSlug = form.publishedAt
        ? form.slug
        : uniqueSlug(form.title, existingRecipes, form.id);
      const publishedAt =
        status === 'published'
          ? form.publishedAt || new Date().toISOString()
          : (form.publishedAt ?? null);
      const payload = {
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
        difficulty: form.difficulty || null,
        calories: form.calories ? Number(form.calories) : null,
        videoUrl: form.videoUrl.trim(),
        accessTier: form.accessTier,
        priceBRL: form.accessTier === 'paid' ? parsedPrice : null,
        fullIngredients: parseLines(form.ingredientsText),
        fullInstructions: parseLines(form.instructionsText),
        tags: form.tagsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        excerpt: form.excerpt.trim(),
        seoTitle: form.seoTitle.trim(),
        seoDescription: form.seoDescription.trim(),
        isFeatured: form.isFeatured,
        status,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        publishedAt,
      };

      if (isOffline) {
        if (!payload.title) {
          toast.error('Informe pelo menos o título para salvar o rascunho local.');
          return;
        }

        const savedDraft = await saveAdminRecipeDraftLocal({
          draftId: form.localDraftId,
          tenantSlug,
          serverRecipeId: form.id,
          baseServerUpdatedAt: form.updatedAt ?? null,
          payload: {
            ...payload,
            id: form.id || form.localDraftId,
          },
        });
        setForm((current) => ({
          ...current,
          localDraftId: savedDraft.draftId,
          slug: current.slug || nextSlug,
          status,
          updatedAt: savedDraft.updatedAt,
          publishedAt,
        }));
        toast.success('Rascunho local salvo neste dispositivo.');
        if (!form.id) {
          navigate(buildTenantAdminPath(`receitas/${savedDraft.draftId}/editar`, tenantSlug), {
            replace: true,
          });
        }
        return;
      }

      await saveRecipe(payload);
      toast.success(status === 'published' ? 'Receita publicada' : 'Rascunho salvo');
      navigate(buildTenantAdminPath('receitas', tenantSlug));
    } catch (error) {
      logger.error('recipe-editor-save', error);
      toast.error('Nao foi possivel salvar a receita.');
    } finally {
      setSaving(false);
    }
  }

  return {
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
    newCategoryIcon,
    setNewCategoryIcon,
    handleCreateCategory,
  };
}
