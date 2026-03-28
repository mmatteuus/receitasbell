import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/RecipeCard";
import type { RecipeRecord } from "@/lib/recipes/types";

type HomeGratinProps = {
  gratinRecipes: RecipeRecord[];
  onViewAll: () => void;
};

export function HomeGratin({ gratinRecipes, onViewAll }: HomeGratinProps) {
  return (
    <section className="container px-4 py-12">
      <Reveal>
        <div className="mb-7 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Conforto de forno
            </p>
            <h2 className="text-3xl">Receitas gratinadas para dividir à mesa</h2>
            <p className="max-w-2xl text-muted-foreground">
              Preparos cremosos, dourados e pensados para quem quer uma refeição generosa com cara
              de ocasião.
            </p>
          </div>
          <Button
            variant="link"
            onClick={onViewAll}
            className="px-0"
          >
            Ver todas
          </Button>
        </div>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {gratinRecipes.map((recipe, index) => (
          <Reveal key={recipe.id} delayMs={index * 40}>
            <RecipeCard recipe={recipe} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
