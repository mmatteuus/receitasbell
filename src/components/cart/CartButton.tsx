import { Link, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

type CartButtonProps = {
  mobile?: boolean;
  onClick?: () => void;
};

export function CartButton({ mobile = false, onClick }: CartButtonProps) {
  const { pathname } = useLocation();
  const { count } = useCart();
  const isActive = pathname === "/carrinho";

  if (mobile) {
    return (
      <Link to="/carrinho" className="relative p-2" onClick={onClick}>
        <ShoppingCart aria-hidden="true" className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      to="/carrinho"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <ShoppingCart aria-hidden="true" className="h-4 w-4" />
      Carrinho
      {count > 0 && (
        <Badge className="ml-1 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px]">
          {count}
        </Badge>
      )}
    </Link>
  );
}
