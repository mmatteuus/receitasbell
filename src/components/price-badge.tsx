"use client";

import { AccessTier } from "@/types/recipe";

interface PriceBadgeProps {
  accessTier: AccessTier;
  priceCents?: number;
  className?: string;
}

export function PriceBadge({ accessTier, priceCents, className = "" }: PriceBadgeProps) {
  const isFree = accessTier === 'free';
  
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border";
  
  const colorClasses = isFree 
    ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" 
    : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";

  const formattedPrice = priceCents 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(priceCents / 100)
    : "PREMIUM";

  return (
    <span className={`${baseClasses} ${colorClasses} ${className}`}>
      {isFree ? "GRÁTIS" : formattedPrice}
    </span>
  );
}