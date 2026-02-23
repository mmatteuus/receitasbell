"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PaywallBoxProps {
  price: number;
  recipeSlug: string;
}

export function PaywallBox({ price, recipeSlug }: PaywallBoxProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price / 100);

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/30 p-8 text-center dark:border-orange-900/30 dark:bg-orange-950/10">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-orange-100 p-4 text-orange-600 dark:bg-orange-900/50">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Conteúdo Exclusivo</h3>
        <p className="max-w-xs text-gray-600 dark:text-gray-400">
          Esta receita completa está disponível por apenas <span className="font-bold text-orange-600">{formattedPrice}</span>.
        </p>
        <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
          <Link to={`/checkout?slug=${recipeSlug}`}>Desbloquear Agora</Link>
        </Button>
      </div>
    </div>
  );
}