import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CartItemsList } from '@/components/cart/CartItemsList';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCart } from '@/hooks/use-cart';

export default function CartPage() {
  const { items, remove, clear, getTotal } = useCart();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Carrinho vazio</h1>
        <p className="text-muted-foreground">
          Você ainda não adicionou receitas pagas ao carrinho.
        </p>
        <Button asChild>
          <Link to="/buscar?tier=paid">Ver receitas pagas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">Carrinho</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length} {items.length === 1 ? 'receita' : 'receitas'}
      </p>

      <div className="mt-6 space-y-4">
        <CartItemsList items={items} onRemove={remove} />
      </div>

      <Separator className="my-6" />

      <CartSummary total={total} onClear={clear} />
    </div>
  );
}
