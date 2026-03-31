import type { FormEvent } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/motion/Reveal";
import SmartImage from "@/components/SmartImage";
import type { SettingsMap } from "@/types/settings";

type HomeHeroProps = {
  settings: SettingsMap;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
};

export function HomeHero({
  settings,
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  onPrimaryCta,
  onSecondaryCta,
}: HomeHeroProps) {
  return (
    <section
      className="relative overflow-hidden border-b bg-gradient-to-b from-orange-50 via-amber-50/70 to-background dark:from-slate-950 dark:via-slate-900/40 py-10 sm:py-14 lg:py-20"
    >
      {/* Overlay para contraste no dark mode */}
      <div className="absolute inset-0 z-0 hidden bg-black/20 dark:block" />

      <div className="pointer-events-none absolute -top-24 right-[-140px] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="container relative grid items-center gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <div className="space-y-6">
            {settings.heroBadge && (
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-background/80 px-4 py-1 text-xs"
              >
                {settings.heroBadge}
              </Badge>
            )}
            <h1
              data-testid="home-hero-heading"
              className="max-w-[18ch] text-4xl leading-tight text-foreground dark:text-slate-50 sm:text-5xl lg:text-6xl font-bold"
            >
              {settings.heroTitle}
            </h1>
            <p className="max-w-[58ch] text-base text-muted-foreground dark:text-slate-300 sm:text-lg">
              {settings.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 shadow-sm transition-transform hover:-translate-y-0.5"
                onClick={onPrimaryCta}
              >
                {settings.heroPrimaryCtaLabel}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="transition-transform hover:-translate-y-0.5"
                onClick={onSecondaryCta}
              >
                {settings.heroSecondaryCtaLabel}
              </Button>
            </div>
            <form onSubmit={onSearchSubmit} className="mt-2 flex max-w-xl gap-2">
              <label htmlFor="home-search" className="sr-only">
                Buscar receitas
              </label>
              <div className="relative flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="home-search"
                  type="search"
                  placeholder="Busque por prato, ingrediente ou ocasião"
                  data-testid="home-search-input"
                  className="h-11 rounded-xl pl-9"
                  value={searchTerm}
                  onChange={(event) => onSearchTermChange(event.target.value)}
                />
              </div>
              <Button type="submit" className="h-11 rounded-xl">
                Buscar
              </Button>
            </form>
          </div>
        </Reveal>
        <Reveal delayMs={120}>
          <div className="relative">
            <SmartImage
              src={settings.heroImageUrl}
              alt={settings.siteName}
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-[340px] w-full rounded-3xl object-cover shadow-2xl sm:h-[420px]"
              data-testid="home-hero-visual"
            />
            <div className="absolute bottom-5 left-5 rounded-2xl border border-white/30 bg-black/35 px-4 py-3 text-white backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">{settings.heroImageCaption || "Seleção da Casa"}</p>
              <p className="font-heading text-xl">{settings.heroImageSubtitle || "Receitas para impressionar sem complicar"}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
