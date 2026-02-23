"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MonetizationSection } from "./monetization-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const recipeSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  accessTier: z.enum(["free", "paid"]),
  priceCents: z.coerce.number().min(0, "O preço não pode ser negativo").optional(),
  teaserIngredients: z.string().optional(),
}).refine((data) => {
  if (data.accessTier === "paid") {
    return data.priceCents !== undefined && data.priceCents > 0;
  }
  return true;
}, {
  message: "Preço obrigatório para receitas pagas",
  path: ["priceCents"],
});

type RecipeFormData = z.infer<typeof recipeSchema>;

export function RecipeForm() {
  const methods = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: "",
      description: "",
      accessTier: "free",
      priceCents: 0,
      teaserIngredients: "",
    },
  });

  const onSubmit = (data: RecipeFormData) => {
    console.log("Dados da receita salvos:", data);
    toast.success("Receita salva com sucesso (Simulado)");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background rounded-xl border shadow-sm">
      <div className="mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold">Editor de Receita</h2>
        <p className="text-muted-foreground">Configure os detalhes e as opções de monetização.</p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Receita</Label>
              <Input 
                id="title" 
                placeholder="Ex: Bolo de Cenoura Gourmet" 
                {...methods.register("title")} 
              />
              {methods.formState.errors.title && (
                <p className="text-xs text-red-500">{methods.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Curta</Label>
              <Textarea 
                id="description" 
                placeholder="Uma breve introdução para atrair os leitores..." 
                {...methods.register("description")} 
              />
              {methods.formState.errors.description && (
                <p className="text-xs text-red-500">{methods.formState.errors.description.message}</p>
              )}
            </div>
          </div>

          <MonetizationSection />

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="ghost" onClick={() => methods.reset()}>
              Descartar
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}