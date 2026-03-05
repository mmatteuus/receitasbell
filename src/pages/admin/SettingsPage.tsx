import { useState, useEffect } from "react";
import { Settings, Upload, Palette, Type, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Receitas do Bell",
  siteDescription: "Receitas testadas e aprovadas para tornar seus momentos na cozinha inesquecíveis.",
  logoUrl: "",
  primaryColor: "#e8590c",
  secondaryColor: "#f5f5f4",
  accentColor: "#f5f5f4",
  headingFont: "DM Serif Display",
  bodyFont: "DM Sans",
};

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

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
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const stored = localStorage.getItem("rdb_site_settings");
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  });
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl);

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
      handleChange("logoUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem("rdb_site_settings", JSON.stringify(settings));

    // Apply theme colors to CSS variables
    const primary = hexToHsl(settings.primaryColor);
    const secondary = hexToHsl(settings.secondaryColor);
    const accent = hexToHsl(settings.accentColor);
    const root = document.documentElement;
    root.style.setProperty("--primary", `${primary.h} ${primary.s}% ${primary.l}%`);
    root.style.setProperty("--secondary", `${secondary.h} ${secondary.s}% ${secondary.l}%`);
    root.style.setProperty("--accent", `${accent.h} ${accent.s}% ${accent.l}%`);
    root.style.setProperty("--ring", `${primary.h} ${primary.s}% ${primary.l}%`);

    toast({
      title: "Configurações salvas",
      description: "As alterações foram aplicadas com sucesso.",
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setLogoPreview("");
    localStorage.removeItem("rdb_site_settings");
    // Remove inline overrides
    const root = document.documentElement;
    root.style.removeProperty("--primary");
    root.style.removeProperty("--secondary");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--ring");
    toast({
      title: "Configurações restauradas",
      description: "Os valores padrão foram restaurados.",
    });
  };

  // Apply saved theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("rdb_site_settings");
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<SiteSettings>;
      if (parsed.primaryColor) {
        const primary = hexToHsl(parsed.primaryColor);
        document.documentElement.style.setProperty("--primary", `${primary.h} ${primary.s}% ${primary.l}%`);
        document.documentElement.style.setProperty("--ring", `${primary.h} ${primary.s}% ${primary.l}%`);
      }
    }
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize o nome, logo e cores do seu site.</p>
      </div>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Identidade do Site
          </CardTitle>
          <CardDescription>Nome, descrição e logotipo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Nome do Site</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => handleChange("siteName", e.target.value)}
              placeholder="Receitas do Bell"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Descrição</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => handleChange("siteDescription", e.target.value)}
              placeholder="Uma breve descrição do seu site..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Logotipo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 cursor-pointer rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Enviar Logo
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG. Máx 1MB.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Cores do Tema
          </CardTitle>
          <CardDescription>Defina a paleta de cores do site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={settings.primaryColor}
                  onChange={(e) => handleChange("primaryColor", e.target.value)}
                  className="h-10 w-10 rounded-md border cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => handleChange("primaryColor", e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Cor Secundária</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondaryColor"
                  value={settings.secondaryColor}
                  onChange={(e) => handleChange("secondaryColor", e.target.value)}
                  className="h-10 w-10 rounded-md border cursor-pointer"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) => handleChange("secondaryColor", e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Cor de Destaque</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="accentColor"
                  value={settings.accentColor}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="h-10 w-10 rounded-md border cursor-pointer"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <Separator className="my-4" />
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="h-12 w-24 rounded-md border flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Primária
              </div>
              <div
                className="h-12 w-24 rounded-md border flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: settings.secondaryColor }}
              >
                Secundária
              </div>
              <div
                className="h-12 w-24 rounded-md border flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: settings.accentColor }}
              >
                Destaque
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-5 w-5 text-primary" />
            Tipografia
          </CardTitle>
          <CardDescription>Fontes para títulos e corpo do texto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headingFont">Fonte dos Títulos</Label>
              <select
                id="headingFont"
                value={settings.headingFont}
                onChange={(e) => handleChange("headingFont", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <p
                className="text-lg mt-2 border rounded-md p-3"
                style={{ fontFamily: settings.headingFont }}
              >
                Exemplo de Título
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyFont">Fonte do Corpo</Label>
              <select
                id="bodyFont"
                value={settings.bodyFont}
                onChange={(e) => handleChange("bodyFont", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <p
                className="text-sm mt-2 border rounded-md p-3"
                style={{ fontFamily: settings.bodyFont }}
              >
                Exemplo de texto do corpo com a fonte selecionada. Aqui você pode ver como ficará o conteúdo das receitas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar Padrão
        </Button>
      </div>
    </div>
  );
}
