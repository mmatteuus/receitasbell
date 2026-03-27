import { Link } from "react-router-dom";
import { X, Plus, Minus } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { Button } from "@/components/ui/button";
import { PriceBadge } from "@/components/price-badge";

interface CartItemsListProps {
  items: CartItem[];
  onRemove: (recipeId: string) => void;
  onUpdateQuantity?: (recipeId: string, delta: number) => void;
}

export function CartItemsList({ items, onRemove }: CartItemsListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.recipeId}
          className="flex gap-3 rounded-xl border bg-card p-3 shadow-sm sm:gap-4 sm:p-4"
        >
          <Link
            to={`/receitas/${item.slug}`}
            className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24"
          >
            <img
              src={item.imageUrl || "/placeholder.svg"}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <Link
                to={`/receitas/${item.slug}`}
                className="line-clamp-1 text-sm font-semibold hover:underline sm:text-base"
              >
                {item.title}
              </Link>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                Receita premium pronta para checkout
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <PriceBadge accessTier="paid" priceBRL={item.priceBRL} />
                {item.quantity > 1 && (
                  <span className="text-[10px] text-muted-foreground">
                    {item.quantity}x R$ {item.priceBRL.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border bg-muted/30 px-1 py-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onUpdateQuantity?.(item.recipeId, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-4 text-center text-xs font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onUpdateQuantity?.(item.recipeId, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onRemove(item.recipeId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
