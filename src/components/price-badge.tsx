import { AccessTier } from '@/types/recipe';
import { formatBRL } from '@/lib/helpers';

interface PriceBadgeProps {
  accessTier: AccessTier;
  priceBRL?: number | null;
  className?: string;
}

export function PriceBadge({ accessTier, priceBRL, className = '' }: PriceBadgeProps) {
  const isFree = accessTier === 'free';
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border';
  const color = isFree
    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
    : 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';

  return (
    <span className={`${base} ${color} ${className}`}>
      {isFree ? 'GRÁTIS' : priceBRL ? formatBRL(priceBRL) : 'PREMIUM'}
    </span>
  );
}
