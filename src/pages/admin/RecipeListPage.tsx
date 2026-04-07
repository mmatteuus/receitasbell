import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  PlusCircle,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Globe,
  FileText,
  Clock,
  BarChart,
  Layers,
  Users,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteRecipe, getRecipes, saveRecipe, uniqueSlug } from '@/lib/repos/recipeRepo';
import { useAppContext } from '@/contexts/app-context';
import type { RecipeRecord } from '@/lib/recipes/types';
import { PriceBadge } from '@/components/price-badge';
import { toast } from 'sonner';
import { getRecipeImage, getRecipePresentation } from '@/lib/recipes/presentation';
import { buildTenantAdminPath, getCurrentTenantSlug } from '@/lib/tenant';
import { getAdminSnapshot, saveAdminSnapshot } from '@/pwa/offline/cache/admin-snapshot';

import { PageHead } from '@/components/PageHead';

export default function RecipeListPage() {
  const location = useLocation();
  const tenantSlug = getCurrentTenantSlug(location.pathname);
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const { categories } = useAppContext();

  useEffect(() => {
    async function loadRecipes() {
      try {
        const nextRecipes = await getRecipes();
        setRecipes(nextRecipes);
        setSnapshotMode(false);
        const syncedAt = new Date().toISOString();
        setLastSyncedAt(syncedAt);
        if (tenantSlug) {
          await saveAdminSnapshot({
            tenantSlug,
            recipesSummary: {
              recipes: nextRecipes,
            },
            lastSyncedAt: syncedAt,
          });
        }
      } catch (error) {
        if (tenantSlug) {
          const snapshot = await getAdminSnapshot(tenantSlug);
          const summary = snapshot?.recipesSummary as { recipes?: RecipeRecord[] } | undefined;
          if (summary?.recipes) {
            setRecipes(summary.recipes);
            setSnapshotMode(true);
            setLastSyncedAt(snapshot?.lastSyncedAt || null);
          } else {
            console.error('Failed to load recipes', error);
            toast.error('Nao foi possivel carregar as receitas.');
          }
        } else {
          console.error('Failed to load recipes', error);
          toast.error('Nao foi possivel carregar as receitas.');
        }
      } finally {
        setLoading(false);
      }
    }

    void loadRecipes();
  }, [tenantSlug]);

  async function refresh() {
    try {
      const nextRecipes = await getRecipes();
      setRecipes(nextRecipes);
    } catch (error) {
      console.error('Failed to refresh recipes', error);
    }
  }

  async function handleTogglePublish(recipe: RecipeRecord) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.error('Publicação offline não está disponível.');
      return;
    }
    const now = new Date().toISOString();
    await saveRecipe({
      ...recipe,
      status: recipe.status === 'published' ? 'draft' : 'published',
      publishedAt: recipe.status === 'draft' ? now : recipe.publishedAt,
    });
    toast.success(
      recipe.status === 'published' ? 'Receita movida para rascunho' : 'Receita publicada'
    );
    await refresh();
  }

  async function handleDuplicate(recipe: RecipeRecord) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.error('Duplicação offline não está disponível.');
      return;
    }
    await saveRecipe({
      ...recipe,
      id: undefined,
      title: `${recipe.title} (cópia)`,
      slug: uniqueSlug(`${recipe.title} copia`, recipes),
      status: 'draft',
      publishedAt: null,
      createdAt: undefined,
    });
    toast.success('Receita duplicada');
    await refresh();
  }

  async function handleDelete(recipe: RecipeRecord) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.error('Exclusão offline não está disponível.');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;

    try {
      await deleteRecipe(recipe.id);
      setRecipes((current) => current.filter((item) => item.id !== recipe.id));
      toast.success('Receita excluida');
    } catch (error) {
      console.error('Failed to delete recipe', error);
      toast.error('Nao foi possivel excluir a receita.');
    }
  }

  return (
    <>
      <PageHead
        title="Gerenciar receitas"
        description="Veja, edite e publique receitas no painel administrativo."
        noindex={true}
      />
      <div>
        <AdminPageHeader
          title="Receitas"
          description={`${recipes.length} receita${recipes.length !== 1 ? 's' : ''}`}
          actions={
            <Link to={buildTenantAdminPath('receitas/nova', tenantSlug)}>
              <Button className="w-full gap-2 sm:w-auto">
                <PlusCircle className="h-4 w-4" /> Nova Receita
              </Button>
            </Link>
          }
        />
        {snapshotMode && (
          <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Modo offline — dados podem estar desatualizados.
            </p>
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Carregando receitas...
          </div>
        ) : (
          <>
            <div className="mt-6 hidden overflow-x-auto rounded-xl border bg-card sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagem</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Info</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe) => {
                    const category = categories.find((item) => item.slug === recipe.categorySlug);
                    const presentation = getRecipePresentation(recipe);
                    const imageUrl = getRecipeImage(recipe);

                    return (
                      <TableRow
                        key={recipe.id}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt=""
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <FileText className="h-5 w-5 opacity-40" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm sm:text-base leading-tight">
                              {presentation.cardTitle}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">/{recipe.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {category ? (
                            <Badge
                              variant="outline"
                              className="font-normal border-primary/20 bg-primary/5 text-primary"
                            >
                              {category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <PriceBadge
                            accessTier={recipe.accessTier}
                            priceBRL={recipe.priceBRL}
                            className="scale-90 origin-left"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={recipe.status === 'published' ? 'default' : 'secondary'}
                            className={
                              recipe.status === 'published'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
                            }
                          >
                            {recipe.status === 'published' ? 'Publicada' : 'Rascunho'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{' '}
                              {recipe.totalTime ?? (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)}{' '}
                              min
                            </div>
                            {recipe.difficulty && (
                              <div className="flex items-center gap-1 capitalize">
                                <BarChart className="h-3 w-3" /> {recipe.difficulty}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={buildTenantAdminPath(`receitas/${recipe.id}/editar`, tenantSlug)}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Editar ${presentation.cardTitle}`}
                              >
                                <Pencil className="h-4 w-4 text-primary" />
                              </Button>
                            </Link>
                            <a
                              href={`/receitas/${recipe.slug}${recipe.status === 'draft' ? '?preview=1' : ''}`}
                              target="_blank"
                              rel="noopener"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Ver pré-visualização de ${presentation.cardTitle}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={
                                recipe.status === 'published'
                                  ? `Despublicar ${presentation.cardTitle}`
                                  : `Publicar ${presentation.cardTitle}`
                              }
                              onClick={() => void handleTogglePublish(recipe)}
                            >
                              {recipe.status === 'published' ? (
                                <FileText className="h-4 w-4" />
                              ) : (
                                <Globe className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Duplicar ${presentation.cardTitle}`}
                              onClick={() => void handleDuplicate(recipe)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Excluir ${presentation.cardTitle}`}
                              onClick={() => void handleDelete(recipe)}
                            >
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

            <div className="mt-6 grid gap-4 sm:hidden">
              {recipes.map((recipe) => {
                const category = categories.find((item) => item.slug === recipe.categorySlug);
                const presentation = getRecipePresentation(recipe);
                const imageUrl = getRecipeImage(recipe);

                return (
                  <div
                    key={recipe.id}
                    className="relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all active:scale-[0.98]"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <FileText className="h-6 w-6 opacity-30" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <Badge
                            variant={recipe.status === 'published' ? 'default' : 'secondary'}
                            className={`text-[10px] h-5 ${recipe.status === 'published' ? 'bg-green-600' : 'bg-orange-100 text-orange-800 border-orange-200'}`}
                          >
                            {recipe.status === 'published' ? 'Publicada' : 'Rascunho'}
                          </Badge>
                          <PriceBadge
                            accessTier={recipe.accessTier}
                            priceBRL={recipe.priceBRL}
                            className="scale-75 origin-right"
                          />
                        </div>
                        <h3 className="mt-1 font-semibold text-base leading-snug truncate">
                          {presentation.cardTitle}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {category && (
                            <span className="font-medium text-primary">{category.name}</span>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {recipe.totalTime || 30} min
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex border-t bg-muted/30 divide-x">
                      <Link
                        to={buildTenantAdminPath(`receitas/${recipe.id}/editar`, tenantSlug)}
                        className="flex-1"
                      >
                        <Button variant="ghost" className="w-full h-11 rounded-none gap-2 text-xs">
                          <Pencil className="h-3.5 w-3.5 text-primary" /> Editar
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="flex-1 h-11 rounded-none gap-2 text-xs"
                        onClick={() => void handleTogglePublish(recipe)}
                      >
                        {recipe.status === 'published' ? (
                          <>
                            <FileText className="h-3.5 w-3.5" /> Pausar
                          </>
                        ) : (
                          <>
                            <Globe className="h-3.5 w-3.5 text-green-600" /> Publicar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-11 w-12 px-0 rounded-none text-destructive hover:bg-destructive/10"
                        onClick={() => void handleDelete(recipe)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
