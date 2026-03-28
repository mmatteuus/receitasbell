import { useSearchParams, Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/PageHead";

export default function FailurePage() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");
  const retryHref = slug ? `/checkout?slug=${slug}` : "/carrinho";

  return (
    <div className="container max-w-lg py-20 text-center animate-in fade-in duration-500">
      <PageHead title="Pagamento Não Aprovado" noindex />
      <div className="mx-auto h-24 w-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 dark:bg-red-900/30 dark:text-red-400">
        <XCircle className="h-12 w-12" />
      </div>

      <h1 className="text-3xl font-bold mb-2">Pagamento Não Aprovado</h1>
      <p className="text-muted-foreground mb-8">
        Infelizmente o pagamento não foi processado. Nenhum valor foi cobrado.
      </p>

      <div className="bg-card border rounded-xl p-6 shadow-sm mb-8 text-left space-y-2">
        <p className="text-sm font-medium">Possíveis motivos:</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Cartão recusado pelo emissor</li>
          <li>Saldo insuficiente</li>
          <li>Dados de pagamento incorretos</li>
          <li>PIX expirado ou cancelado</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild>
          <Link to={retryHref}>Tentar Novamente</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    </div>
  );
}
