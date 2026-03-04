import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");
  const paymentId = searchParams.get("payment_id");
  const count = Number(searchParams.get("count") || "1");
  const isMulti = count > 1 || !slug;

  return (
    <div className="container max-w-lg px-4 py-20 text-center animate-in zoom-in-95 duration-500">
      <div className="mx-auto h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="h-12 w-12" />
      </div>

      <h1 className="text-3xl font-bold mb-2">Compra Confirmada!</h1>
      <p className="text-muted-foreground mb-8">
        {isMulti
          ? `${count} receitas foram desbloqueadas com sucesso!`
          : "Sua receita foi desbloqueada com sucesso. Aproveite o conteúdo completo!"}
      </p>

      <div className="bg-card border rounded-xl p-6 shadow-sm text-left mb-8 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" /> Aprovado
          </span>
        </div>
        {paymentId && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">ID do Pagamento</span>
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{paymentId}</code>
          </div>
        )}
        {isMulti && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Receitas desbloqueadas</span>
            <span className="font-semibold">{count}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {slug ? (
          <Button asChild size="lg" className="gap-2">
            <Link to={`/receitas/${slug}`}>
              Ver Receita Completa <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" className="gap-2">
            <Link to="/buscar?tier=paid">
              Ver Receitas Desbloqueadas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    </div>
  );
}
