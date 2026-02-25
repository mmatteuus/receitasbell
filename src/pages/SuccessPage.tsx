import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight, Copy } from 'lucide-react';
import { Payment } from '@/lib/payments/types';
import { toast } from 'sonner';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (id) {
      const payments: Payment[] = JSON.parse(localStorage.getItem('rdb_payments_v1') || '[]');
      const found = payments.find(p => p.id === id);
      if (found) setPayment(found);
    }
  }, [id]);

  const copyId = () => {
    if (id) {
      navigator.clipboard.writeText(id);
      toast.success('ID copiado!');
    }
  };

  return (
    <div className="container max-w-lg py-20 text-center animate-in zoom-in-95 duration-500">
      <div className="mx-auto h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="h-12 w-12" />
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Pedido Recebido!</h1>
      <p className="text-muted-foreground mb-8">
        Obrigado pela sua compra. Estamos processando seu pagamento.
      </p>

      <div className="bg-card border rounded-xl p-6 shadow-sm text-left mb-8">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <span className="text-sm font-medium text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID do Pagamento</span>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{id || '...'}</code>
            <button onClick={copyId} className="text-muted-foreground hover:text-foreground transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use este ID no painel Admin para aprovar ou rejeitar o pagamento.
          </p>
        </div>
      </div>

      <Link to="/" className="text-primary hover:underline inline-flex items-center gap-1">
        Voltar para a loja <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}