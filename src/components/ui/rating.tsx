import { Star, StarHalf } from "lucide-react";

interface RatingProps {
  rating: number;
  count?: number;
  className?: string;
  showCount?: boolean;
}

export function Rating({ rating, count, className = "", showCount = true }: RatingProps) {
  // Garante que a nota esteja entre 0 e 5
  const safeRating = Math.min(Math.max(rating, 0), 5);
  
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-1 ${className}`} title={`${safeRating} de 5 estrelas`}>
      <div className="flex text-yellow-400">
        {/* Estrelas Cheias */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-current" />
        ))}
        
        {/* Meia Estrela */}
        {hasHalfStar && <StarHalf className="h-4 w-4 fill-current" />}
        
        {/* Estrelas Vazias */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/30" />
        ))}
      </div>
      
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground font-medium ml-1">
          ({count})
        </span>
      )}
    </div>
  );
}