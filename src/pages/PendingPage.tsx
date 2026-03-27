import { useSearchParams, Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/PageHead";

export default function PendingPage() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");
  const paymentId = searchParams.get("payment_id");

  return (
    <div className="container max-w-lg py-20 text-center animate-in fade-in duration-500">
      <PageHead title="Pagamento Pendente" noindex />
      <div className="mx-auto h-24 w-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Clock className="h-12 w-12" />
      </div>

      <h1 className="text-3xl font-bold mb-2">Pagamento Pendente</h1>
      <p className="text-muted-foreground mb-8">
        Seu pagamento está sendo processado. Assim que for confirmado, a receita será desbloqueada automaticamente.
      </p>

      <div className="bg-card border rounded-xl p-6 shadow-sm mb-8 space-y-3 text-left">
        <p className="text-sm text-muted-foreground">
          Se você pagou via Pix ou boleto, pode levar alguns minutos para a confirmação.
          Você receberá uma notificação quando o acesso for liberado.
        </p>
        {paymentId && (
          <div className="flex justify-between items-center border-t pt-3">
            <span className="text-sm text-muted-foreground">ID do pedido</span>
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{paymentId}</code>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {slug && (
          <Button asChild>
            <Link to={`/receitas/${slug}`}>Ver Receita</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    </div>
  );
}
