import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, Home, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app-context";
import { DEFAULT_HOME_SETTINGS } from "@/lib/defaults";
import { updateSettings } from "@/lib/api/settings";
import type { HomeSectionId, HomeSettings } from "@/types/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const HOME_SECTIONS: Array<{ id: HomeSectionId; label: string }> = [
  { id: "hero", label: "Hero" },
  { id: "trustBar", label: "Faixa de confiança" },
  { id: "categories", label: "Categorias" },
  { id: "featured", label: "Destaques" },
  { id: "premium", label: "Premium" },
  { id: "recent", label: "Recentes" },
  { id: "about", label: "Sobre" },
  { id: "newsletter", label: "Newsletter" },
];

const FEATURED_MODES: Array<{ value: HomeSettings["featuredMode"]; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "latest", label: "Mais recentes" },
  { value: "category", label: "Por categoria" },
  { value: "featuredFlag", label: "Flag de destaque (isFeatured)" },
];

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function HomePageSettings() {
  const { settings, refreshSettings } = useAppContext();
  const [form, setForm] = useState<HomeSettings>(DEFAULT_HOME_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      heroBadge: settings.heroBadge,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      heroImageUrl: settings.heroImageUrl,
      heroPrimaryCtaLabel: settings.heroPrimaryCtaLabel,
      heroPrimaryCtaHref: settings.heroPrimaryCtaHref,
      heroSecondaryCtaLabel: settings.heroSecondaryCtaLabel,
      heroSecondaryCtaHref: settings.heroSecondaryCtaHref,
      featuredSectionTitle: settings.featuredSectionTitle,
      featuredSectionSubtitle: settings.featuredSectionSubtitle,
      featuredMode: settings.featuredMode,
      featuredRecipeIds: settings.featuredRecipeIds,
      featuredCategorySlug: settings.featuredCategorySlug,
      featuredLimit: settings.featuredLimit,
      showCategoriesGrid: settings.showCategoriesGrid,
      showFeaturedRecipes: settings.showFeaturedRecipes,
      showPremiumSection: settings.showPremiumSection,
      showRecentRecipes: settings.showRecentRecipes,
      showNewsletter: settings.showNewsletter,
      showTrustBar: settings.showTrustBar,
      showAboutSection: settings.showAboutSection,
      trustBarItems: settings.trustBarItems,
      aboutHeadline: settings.aboutHeadline,
      aboutText: settings.aboutText,
      aboutImageUrl: settings.aboutImageUrl,
      homeSectionsOrder: settings.homeSectionsOrder,
    });
  }, [settings]);

  function setField<K extends keyof HomeSettings>(key: K, value: HomeSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setForm((current) => {
      const next = [...current.homeSectionsOrder];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      return { ...current, homeSectionsOrder: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(form);
      await refreshSettings();
      toast.success("Página inicial atualizada");
    } catch (error) {
      console.error("Failed to save home settings", error);
      toast.error("Nao foi possivel salvar a página inicial.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    try {
      await updateSettings(DEFAULT_HOME_SETTINGS);
      await refreshSettings();
      toast.success("Configuração padrão restaurada");
    } catch (error) {
      console.error("Failed to reset home settings", error);
      toast.error("Nao foi possivel restaurar o padrão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Página Inicial</h1>
          <p className="mt-1 text-muted-foreground">Edite a vitrine do site como um mini CMS.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Abrir preview
          </Button>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5 text-primary" /> Hero</CardTitle>
          <CardDescription>Conteúdo principal da dobra inicial.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Badge</Label>
            <Input value={form.heroBadge} onChange={(event) => setField("heroBadge", event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Título</Label>
            <Input value={form.heroTitle} onChange={(event) => setField("heroTitle", event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Subtítulo</Label>
            <Textarea rows={3} value={form.heroSubtitle} onChange={(event) => setField("heroSubtitle", event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Imagem hero (URL)</Label>
            <Input value={form.heroImageUrl} onChange={(event) => setField("heroImageUrl", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CTA primário (texto)</Label>
            <Input value={form.heroPrimaryCtaLabel} onChange={(event) => setField("heroPrimaryCtaLabel", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CTA primário (link)</Label>
            <Input value={form.heroPrimaryCtaHref} onChange={(event) => setField("heroPrimaryCtaHref", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CTA secundário (texto)</Label>
            <Input value={form.heroSecondaryCtaLabel} onChange={(event) => setField("heroSecondaryCtaLabel", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CTA secundário (link)</Label>
            <Input value={form.heroSecondaryCtaHref} onChange={(event) => setField("heroSecondaryCtaHref", event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curadoria de Destaques</CardTitle>
          <CardDescription>Defina como a seção editorial deve ser montada.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Título da seção</Label>
            <Input value={form.featuredSectionTitle} onChange={(event) => setField("featuredSectionTitle", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo da seção</Label>
            <Input value={form.featuredSectionSubtitle} onChange={(event) => setField("featuredSectionSubtitle", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Modo</Label>
            <select
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.featuredMode}
              onChange={(event) => setField("featuredMode", event.target.value as HomeSettings["featuredMode"])}
            >
              {FEATURED_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Limite de cards</Label>
            <Input
              type="number"
              min={3}
              max={12}
              value={form.featuredLimit}
              onChange={(event) => setField("featuredLimit", Number(event.target.value || 7))}
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria (modo category)</Label>
            <Input value={form.featuredCategorySlug} onChange={(event) => setField("featuredCategorySlug", event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>IDs manuais (1 por linha)</Label>
            <Textarea
              rows={4}
              value={form.featuredRecipeIds.join("\n")}
              onChange={(event) => setField("featuredRecipeIds", splitLines(event.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibilidade e Ordem</CardTitle>
          <CardDescription>Ative seções e organize a narrativa da home.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {([
              ["showTrustBar", "Exibir faixa de confiança"],
              ["showCategoriesGrid", "Exibir grid de categorias"],
              ["showFeaturedRecipes", "Exibir seção de destaques"],
              ["showPremiumSection", "Exibir seção premium"],
              ["showRecentRecipes", "Exibir vistos recentemente"],
              ["showAboutSection", "Exibir seção sobre"],
              ["showNewsletter", "Exibir newsletter"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <Label>{label}</Label>
                <Switch checked={form[key]} onCheckedChange={(value) => setField(key, value)} />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Ordem das seções</Label>
            <div className="space-y-2 rounded-lg border p-3">
              {form.homeSectionsOrder.map((sectionId, index) => {
                const section = HOME_SECTIONS.find((item) => item.id === sectionId);
                return (
                  <div key={sectionId} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                    <span className="text-sm font-medium">{section?.label || sectionId}</span>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => moveSection(index, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => moveSection(index, 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Textos Extras</CardTitle>
          <CardDescription>Trust bar e bloco editorial institucional.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Trust bar (1 item por linha)</Label>
            <Textarea
              rows={4}
              value={form.trustBarItems.join("\n")}
              onChange={(event) => setField("trustBarItems", splitLines(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Título do bloco sobre</Label>
            <Input value={form.aboutHeadline} onChange={(event) => setField("aboutHeadline", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Imagem do bloco sobre (URL)</Label>
            <Input value={form.aboutImageUrl} onChange={(event) => setField("aboutImageUrl", event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Texto do bloco sobre</Label>
            <Textarea rows={4} value={form.aboutText} onChange={(event) => setField("aboutText", event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void handleSave()} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar página inicial
        </Button>
        <Button variant="outline" onClick={() => void handleReset()} disabled={saving} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
