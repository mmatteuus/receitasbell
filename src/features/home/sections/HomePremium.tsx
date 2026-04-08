import type { RefObject } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import SmartImage from "@/components/SmartImage";
import { getRecipeImage } from "@/lib/recipes/presentation";
import type { RecipeRecord } from "@/lib/recipes/types";

type HomePremiumProps = {
  premiumRecipes: RecipeRecord[];
  theme: "light" | "dark";
  toggleTheme: () => void;
  premiumRef: RefObject<HTMLDivElement>;
  onExplorePremium: () => void;
};

export function HomePremium({
  premiumRecipes,
  theme,
  toggleTheme,
  premiumRef,
  onExplorePremium,
}: HomePremiumProps) {
  return (
    <section className="border-y bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 py-16 text-zinc-100">
      <div className="container px-4">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Coleção exclusiva
              </p>
              <h2 className="text-4xl font-bold tracking-tight">Receitas Premium para momentos especiais</h2>
              <p className="max-w-2xl text-base text-zinc-300">
                Conteúdos completos, combinações autorais e preparo guiado para quem quer ir além do básico.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
                className="border border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
              >
                {theme === "light" ? <Moon aria-hidden="true" className="h-4 w-4" /> : <Sun aria-hidden="true" className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Reveal>

        {premiumRecipes.length > 0 && (
          <Reveal delayMs={100}>
            <div className="mx-auto overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none z-10" />
              
              <div className="flex items-center justify-between z-20 absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                <div className="max-w-xl">
                  <Badge variant="secondary" className="mb-4 bg-white/20 text-white hover:bg-white/30 backdrop-blur-md">
                    Premium
                  </Badge>
                  <h3 className="text-3xl font-bold text-white mb-2 sm:text-5xl">
                    {premiumRecipes[0].title}
                  </h3>
                  <p className="text-zinc-300 text-lg mb-6 line-clamp-2">
                    {premiumRecipes[0].description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      onClick={onExplorePremium}
                      className="gap-2 bg-white text-zinc-950 hover:bg-zinc-200 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                      size="lg"
                    >
                      Explorar premium
                      <Sparkles aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[16/9] lg:aspect-[21/9]">
                <SmartImage
                  src={getRecipeImage(premiumRecipes[0])}
                  fallbackSrc="/placeholder.svg"
                  alt={premiumRecipes[0].title}
                  sizes="100vw"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
