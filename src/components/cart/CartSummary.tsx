import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/helpers";
import { useAppContext } from "@/contexts/app-context";

interface CartSummaryProps {
  total: number;
  onClear: () => void;
}

export function CartSummary({ total, onClear }: CartSummaryProps) {
  const { settings } = useAppContext();

  return (
    <>
      <div className="flex items-center justify-between text-lg font-bold">
        <span>Total</span>
        <span>{formatBRL(total)}</span>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1 bg-orange-600 hover:bg-orange-700">
          <Link to="/checkout?cart=1">
            {settings.payment_mode === "production"
              ? "Finalizar Compra"
              : "Finalizar Compra (teste)"}
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="gap-2" onClick={onClear}>
          <Trash2 className="h-4 w-4" /> Limpar
        </Button>
      </div>
    </>
  );
}
