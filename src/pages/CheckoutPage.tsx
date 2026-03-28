import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { formatBRL } from '@/lib/helpers';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Lock, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import type { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/app-context';
import { getRecipeBySlug } from '@/lib/repos/recipeRepo';
import { paymentRepo } from '@/lib/repos/paymentRepo';
import { resolveCheckoutResultPath } from '@/lib/payments/checkout';
import { buildCartItemFromRecipe } from '@/lib/utils/recipeAccess';
import { ApiClientError } from '@/lib/api/client';
import { PageHead } from '@/components/PageHead';
import { logger } from '@/lib/logger';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recipeSlug = searchParams.get('slug');
  const isCartCheckout = searchParams.get('cart') === '1';
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [payerName, setPayerName] = useState('');
  const [payerNameError, setPayerNameError] = useState('');
  const { items: cartItems, clear: clearCart } = useCart();
  const { identityEmail, requireIdentity, settings } = useAppContext();

  useEffect(() => {
    async function loadRecipes() {
      if (isCartCheckout) {
        setItems(cartItems);
        return;
      }

      if (recipeSlug) {
        try {
          const recipe = await getRecipeBySlug(recipeSlug);
          setItems(recipe ? [buildCartItemFromRecipe(recipe)] : []);
        } catch (error) {
          logger.error('checkout-recipe', error);
          setItems([]);
        }
      }
    }

    void loadRecipes();
  }, [recipeSlug, isCartCheckout, cartItems]);

  useEffect(() => {
    if (identityEmail && !payerName) {
      setPayerName(identityEmail.split('@')[0]);
      setPayerNameError('');
    }
  }, [identityEmail, payerName]);

  const total = items.reduce((sum, item) => sum + item.priceBRL, 0);

  const handleCheckout = async () => {
    if (!items.length) return;
    setLoading(true);
    if (!payerName.trim()) {
      setPayerNameError('Informe o nome do pagador.');
      setLoading(false);
      return;
    }
    try {
      const buyerEmail = await requireIdentity('Digite seu e-mail para concluir a compra.');
      if (!buyerEmail) {
        setLoading(false);
        return;
      }

      const result = await paymentRepo.createCheckout({
        recipeIds: items.map((item) => item.recipeId),
        items,
        payerName: payerName.trim() || buyerEmail.split('@')[0],
        payerEmail: buyerEmail,
        checkoutReference: crypto.randomUUID(),
      });

      const checkoutUrl = result.checkoutUrl;
      if (checkoutUrl) {
        toast.success('Redirecionando para o checkout seguro do Mercado Pago...');
        window.location.assign(checkoutUrl);
        return;
      }

      if (isCartCheckout && result.status === 'approved') clearCart();
      toast.info('Criamos seu pedido. A confirmação final depende do Mercado Pago.');
      const slug = items.length === 1 ? items[0].slug : '';
      const path = resolveCheckoutResultPath(result.status);
      navigate(
        `${path}?slug=${slug}&status=${result.status}&payment_id=${result.paymentId || ''}&count=${result.unlockedCount}`
      );
    } catch (error) {
      logger.error('checkout', error);
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : 'Nao foi possivel concluir a compra.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="container max-w-lg px-4 py-20 text-center">
        <PageHead title="Finalizar Compra" noindex />
        <h1 className="text-xl font-bold sm:text-2xl">Nenhuma receita selecionada</h1>
        <p className="text-muted-foreground mt-2">Não foi possível carregar os dados.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg px-4 py-8 sm:py-12 animate-in fade-in duration-500">
      <PageHead title="Finalizar Compra" noindex />
      <h1 className="font-heading text-2xl font-bold text-center sm:text-3xl">Finalizar Compra</h1>
      <p className="text-center text-muted-foreground mt-2 text-sm">
        {items.length === 1
          ? 'Você está prestes a desbloquear uma receita exclusiva'
          : `${items.length} receitas no pedido`}
      </p>

      <div className="mt-6 sm:mt-8 rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        {items.map((item) => (
          <div key={item.recipeId} className="flex gap-3 sm:gap-4">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-16 w-16 rounded-lg object-cover shrink-0 sm:h-20 sm:w-20"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-sm font-semibold sm:text-lg truncate">
                {item.title}
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-1 sm:text-sm">
                Receita premium desbloqueada após a compra
              </p>
              <p className="mt-1 text-sm font-bold">{formatBRL(item.priceBRL)}</p>
            </div>
          </div>
        ))}

        <Separator />

        <div className="space-y-2">
          <label htmlFor="payer-name" className="text-sm font-medium">Nome do pagador</label>
          <Input
            id="payer-name"
            value={payerName}
            onChange={(event) => {
              setPayerName(event.target.value);
              setPayerNameError('');
            }}
            aria-invalid={Boolean(payerNameError)}
            aria-describedby={payerNameError ? 'payer-name-error' : undefined}
            placeholder="Ex: Bell Ferreira"
          />
          {payerNameError && (
            <p id="payer-name-error" role="alert" className="text-sm text-destructive">
              {payerNameError}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{formatBRL(total)}</span>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" /> Pagamento seguro via Mercado
            Pago
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-green-600 shrink-0" /> Acesso vitalício ao conteúdo
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-600 shrink-0" /> Liberação instantânea
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processando...
            </span>
          ) : (
            <>
              Pagar {formatBRL(total)} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {settings.payment_mode === 'production'
            ? 'Você será redirecionado para o Checkout do Mercado Pago para concluir o pagamento.'
            : 'No modo sandbox, você será redirecionado para o checkout de testes do Mercado Pago.'}
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link
          to={items.length === 1 ? `/receitas/${items[0].slug}` : '/carrinho'}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
