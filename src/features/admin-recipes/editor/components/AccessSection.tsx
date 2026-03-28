import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeBRLInput } from "@/lib/helpers";
import type { AccessTier } from "@/types/recipe";
import type { EditorState } from "../schema";

type AccessSectionProps = {
  form: EditorState;
  onFieldChange: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
};

export function AccessSection({ form, onFieldChange }: AccessSectionProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Acesso</Label>
          <Select value={form.accessTier} onValueChange={(value) => onFieldChange("accessTier", value as AccessTier)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Grátis</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Preço (R$)</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={form.priceInput}
            disabled={form.accessTier !== "paid"}
            onChange={(event) => onFieldChange("priceInput", event.target.value)}
            onBlur={() => onFieldChange("priceInput", normalizeBRLInput(form.priceInput))}
            placeholder="7,90"
          />
          <p className="text-xs text-muted-foreground">
            Use reais com centavos. Exemplo: 12,90
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags (separadas por vírgula)</Label>
        <Input value={form.tagsText} onChange={(event) => onFieldChange("tagsText", event.target.value)} placeholder="rápido, fácil, premium" />
      </div>
    </>
  );
}
