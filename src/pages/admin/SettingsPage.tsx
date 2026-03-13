import { useEffect, useState } from "react";
import { Settings, Palette, Type, Save, RotateCcw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DEFAULT_SITE_SETTINGS } from "@/lib/defaults";
import type { SiteSettings } from "@/types/settings";
import { updateSettings } from "@/lib/api/settings";
import { useAppContext } from "@/contexts/app-context";

const FONT_OPTIONS = [
  "DM Serif Display",
  "DM Sans",
  "Playfair Display",
  "Inter",
  "Lora",
  "Merriweather",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Source Serif Pro",
];

export default function SettingsPage() {
  const { settings, refreshSettings } = useAppContext();
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      headingFont: settings.headingFont,
      bodyFont: settings.bodyFont,
    });
  }, [settings]);

  function setField<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(form);
      await refreshSettings();
      toast.success("Configurações salvas");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Nao foi possivel salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    try {
      await updateSettings(DEFAULT_SITE_SETTINGS);
      await refreshSettings();
      toast.success("Configurações restauradas");
    } catch (error) {
      console.error("Failed to reset settings", error);
      toast.error("Nao foi possivel restaurar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize o nome, logo, cores e fontes do seu site.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Identidade do Site
          </CardTitle>
          <CardDescription>Esses dados são lidos do Google Sheets e aplicados no frontend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Nome do Site</Label>
            <Input id="siteName" value={form.siteName} onChange={(event) => setField("siteName", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Descrição</Label>
            <Textarea id="siteDescription" value={form.siteDescription} onChange={(event) => setField("siteDescription", event.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              URL do Logotipo
            </Label>
            <Input id="logoUrl" value={form.logoUrl} onChange={(event) => setField("logoUrl", event.target.value)} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">A planilha persiste apenas a URL da imagem.</p>
          </div>

          {form.logoUrl && (
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <img src={form.logoUrl} alt={form.siteName} className="h-16 w-16 rounded object-contain" />
              <div>
                <p className="font-medium">{form.siteName}</p>
                <p className="text-sm text-muted-foreground">Prévia do logo remoto</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Cores do Tema
          </CardTitle>
          <CardDescription>As cores salvas aqui alimentam as variáveis CSS globais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              ["primaryColor", "Cor Primária"],
              ["secondaryColor", "Cor Secundária"],
              ["accentColor", "Cor de Destaque"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={(event) => setField(key, event.target.value)}
                    className="h-10 w-10 rounded-md border cursor-pointer"
                  />
                  <Input value={form[key]} onChange={(event) => setField(key, event.target.value)} className="flex-1 font-mono text-sm" />
                </div>
              </div>
            ))}
          </div>

          <Separator />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-12 w-24 rounded-md border flex items-center justify-center text-xs font-medium text-white" style={{ backgroundColor: form.primaryColor }}>
              Primária
            </div>
            <div className="h-12 w-24 rounded-md border flex items-center justify-center text-xs font-medium" style={{ backgroundColor: form.secondaryColor }}>
              Secundária
            </div>
            <div className="h-12 w-24 rounded-md border flex items-center justify-center text-xs font-medium" style={{ backgroundColor: form.accentColor }}>
              Destaque
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-5 w-5 text-primary" />
            Tipografia
          </CardTitle>
          <CardDescription>Fontes usadas para títulos e textos do site.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Fonte dos títulos</Label>
            <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.headingFont} onChange={(event) => setField("headingFont", event.target.value)}>
              {FONT_OPTIONS.map((font) => <option key={font}>{font}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Fonte do corpo</Label>
            <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.bodyFont} onChange={(event) => setField("bodyFont", event.target.value)}>
              {FONT_OPTIONS.map((font) => <option key={font}>{font}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => void handleSave()} disabled={saving}>
          <Save className="mr-2 h-4 w-4" /> Salvar
        </Button>
        <Button variant="outline" onClick={() => void handleReset()} disabled={saving}>
          <RotateCcw className="mr-2 h-4 w-4" /> Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
