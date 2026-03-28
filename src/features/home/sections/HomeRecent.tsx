import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/RecipeCard";
import type { RecipeRecord } from "@/lib/recipes/types";

type HomeRecentProps = {
  recentRecipes: RecipeRecord[];
  onGoAccount: () => void;
};

export function HomeRecent({ recentRecipes, onGoAccount }: HomeRecentProps) {
  return (
    <section className="container px-4 py-12">
      <Reveal>
        <div className="mb-7 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Seu histórico
            </p>
            <h2 className="text-3xl">Continue de onde parou</h2>
          </div>
          <Button variant="link" onClick={onGoAccount} className="px-0">
            Ir para Minha Conta
          </Button>
        </div>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {recentRecipes.map((recipe, index) => (
          <Reveal key={recipe.id} delayMs={index * 40}>
            <RecipeCard recipe={recipe} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
