"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Info, DollarSign, Lock } from "lucide-react";
import { Recipe } from "@/types/recipe";

export function MonetizationSection() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<Recipe>();
  
  const accessTier = watch("accessTier");
  const priceCents = watch("priceCents");
  const teaserIngredients = watch("teaserIngredients");
  const teaserInstructions = watch("teaserInstructions");

  // Estado local para o valor exibido (BRL formatado)
  const [displayPrice, setDisplayPrice] = useState("");

  // Sincroniza o displayPrice quando o priceCents mudar externamente (ex: carregamento inicial)
  useEffect(() => {
    const currentCents = Math.round(parseFloat(displayPrice.replace(',', '.') || "0") * 100);
    if (priceCents !== undefined && priceCents !== currentCents) {
      const formatted = (priceCents / 100).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      setDisplayPrice(formatted);
    }
  }, [priceCents]); // Dependência apenas em priceCents para evitar loops

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayPrice(value);

    // Converte input (ex: "7,90") para centavos (790)
    const parsed = parseFloat(value.replace(',', '.'));
    if (!isNaN(parsed)) {
      setValue("priceCents", Math.round(parsed * 100), { shouldValidate: true });
    } else if (value === "") {
      setValue("priceCents", 0, { shouldValidate: true });
    }
  };

  return (
    <Tabs.Root defaultValue="config" className="flex flex-col w-full border rounded-lg overflow-hidden bg-card">
      <Tabs.List className="flex border-b bg-muted/50" aria-label="Configurações da Receita">
        <Tabs.Trigger 
          value="config"
          className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 outline-none cursor-default"
        >
          Geral
        </Tabs.Trigger>
        <Tabs.Trigger 
          value="monetization"
          className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 outline-none cursor-default flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Monetização
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="config" className="p-6 outline-none">
        <p className="text-sm text-muted-foreground">Configure os detalhes básicos da receita na aba principal.</p>
      </Tabs.Content>

      <Tabs.Content value="monetization" className="p-6 outline-none space-y-6 animate-in fade-in duration-300">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accessTier">Nível de Acesso</Label>
            <Select 
              onValueChange={(value) => setValue("accessTier", value as 'free' | 'paid')} 
              defaultValue={accessTier}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o acesso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Grátis (Público)</SelectItem>
                <SelectItem value="paid">Pago (Privado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accessTier === 'paid' && (
            <div className="space-y-2">
              <Label htmlFor="priceCents">Preço (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                <Input 
                  id="priceCents"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="pl-9"
                  value={displayPrice}
                  onChange={handlePriceChange}
                />
              </div>
              {errors.priceCents && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.priceCents.message || "Preço obrigatório para receitas pagas"}
                </p>
              )}
            </div>
          )}
        </div>

        {accessTier === 'paid' && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2 text-orange-600">
              <Lock className="h-4 w-4" />
              <h4 className="font-semibold">Conteúdo de Teaser (Preview)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Este conteúdo será visível para todos os usuários antes da compra.
            </p>
            
            <div className="space-y-2">
              <Label>Ingredientes do Teaser</Label>
              <Textarea 
                placeholder="Ex: Farinha, ovos, açúcar... (apenas o básico)"
                {...register("teaserIngredients")}
              />
              {!teaserIngredients?.length && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Aviso: Sem teaser, o paywall mostrará apenas o título.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Instruções do Teaser</Label>
              <Textarea 
                placeholder="Ex: Misture os ingredientes secos... (apenas o início)"
                {...register("teaserInstructions")}
              />
              {!teaserInstructions?.length && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Aviso: Sem instruções de teaser.
                </p>
              )}
            </div>
          </div>
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}