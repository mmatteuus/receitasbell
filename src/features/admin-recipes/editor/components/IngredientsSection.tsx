import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { EditorState } from "../schema";

type IngredientsSectionProps = {
  form: EditorState;
  onFieldChange: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
};

export function IngredientsSection({ form, onFieldChange }: IngredientsSectionProps) {
  return (
    <>
      <Separator />

      <div className="space-y-2">
        <Label>Ingredientes</Label>
        <Textarea
          value={form.ingredientsText}
          onChange={(event) => onFieldChange("ingredientsText", event.target.value)}
          rows={8}
          placeholder="Um ingrediente por linha"
        />
      </div>

      <div className="space-y-2">
        <Label>Modo de preparo</Label>
        <Textarea
          value={form.instructionsText}
          onChange={(event) => onFieldChange("instructionsText", event.target.value)}
          rows={10}
          placeholder="Um passo por linha"
        />
      </div>
    </>
  );
}
