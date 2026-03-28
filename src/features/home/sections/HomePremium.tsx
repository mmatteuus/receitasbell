import type { RefObject } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import RecipeCard from "@/components/RecipeCard";
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
    <section
      className="border-y bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 py-12 text-zinc-100"
    >
      <div className="container px-4">
        <Reveal>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">
                Coleção exclusiva
              </p>
              <h2 className="text-3xl">Receitas Premium para momentos especiais</h2>
              <p className="max-w-2xl text-sm text-zinc-300">
                Conteúdos completos, combinações autorais e preparo guiado para quem quer ir além
                do básico.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
                className="border border-white/20 text-white/80 hover:text-white"
              >
                {theme === "light" ? <Moon aria-hidden="true" className="h-4 w-4" /> : <Sun aria-hidden="true" className="h-4 w-4" />}
              </Button>
              <Button
                onClick={onExplorePremium}
                className="gap-2 bg-white text-zinc-950 hover:bg-zinc-200 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Explorar premium
                <Sparkles aria-hidden="true" className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm text-zinc-200"
                  onClick={() => premiumRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm text-zinc-200"
                  onClick={() => premiumRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
                >
                  →
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
        <div
          ref={premiumRef}
          className="hide-scrollbar flex gap-5 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
        >
          {premiumRecipes.map((recipe, index) => (
            <Reveal key={recipe.id} delayMs={index * 50}>
              <div className="snap-start min-w-[260px] flex-1 md:min-w-[320px]">
                <RecipeCard recipe={recipe} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
