import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { THEME_PALETTES, type ThemePalette } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ThemeColorPickerProps = {
  mobile?: boolean;
  compact?: boolean;
  onSelect?: () => void;
};

function PalettePreview({
  palette,
  className,
  useSiteColors = false,
}: {
  palette: ThemePalette;
  className?: string;
  useSiteColors?: boolean;
}) {
  const { settings } = useAppContext();
  const colors = useSiteColors
    ? [settings.primaryColor, settings.secondaryColor, settings.accentColor]
    : [palette.primaryColor, palette.secondaryColor, palette.accentColor];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {colors.map((color) => (
        <span
          key={`${palette.id}-${color}`}
          className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function PaletteOptions({ mobile = false, onSelect }: ThemeColorPickerProps) {
  const { themePalette, setThemePalette } = useAppContext();

  return (
    <div className={cn("grid gap-2", mobile ? "grid-cols-2" : "grid-cols-1")}>
      {THEME_PALETTES.map((palette) => {
        const active = palette.id === themePalette;
        return (
          <button
            key={palette.id}
            type="button"
            onClick={() => {
              setThemePalette(palette.id);
              onSelect?.();
            }}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors",
              active
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/60"
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{palette.label}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{palette.description}</p>
            </div>
            <PalettePreview
              palette={palette}
              useSiteColors={palette.id === "default"}
              className="shrink-0"
            />
          </button>
        );
      })}
    </div>
  );
}

export default function ThemeColorPicker({
  mobile = false,
  compact = false,
  onSelect,
}: ThemeColorPickerProps) {
  const { themePalette } = useAppContext();
  const [open, setOpen] = useState(false);
  const activePalette =
    THEME_PALETTES.find((palette) => palette.id === themePalette) ?? THEME_PALETTES[0];

  if (mobile) {
    return (
      <div className="space-y-3 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Palette className="h-4 w-4 text-primary" />
          Cor do tema
        </div>
        <PaletteOptions mobile onSelect={onSelect} />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "icon" : "sm"}
          className={cn(!compact && "ml-2 gap-2")}
          aria-label="Mudar cor do tema"
          title="Mudar cor do tema"
        >
          <Palette className="h-4 w-4" />
          {!compact && (
            <>
              <span>Tema</span>
              <PalettePreview
                palette={activePalette}
                useSiteColors={activePalette.id === "default"}
              />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Cores do tema</p>
          <p className="text-xs text-muted-foreground">
            Troque a paleta visual sem alterar as configurações salvas do site.
          </p>
        </div>
        <PaletteOptions
          onSelect={() => {
            setOpen(false);
            onSelect?.();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
