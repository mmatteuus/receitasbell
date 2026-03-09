
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Payment, PaymentEvent } from "@/lib/payments/types";
import { paymentsRepo } from "@/lib/payments/repo";
import { StatusBadge } from "@/components/payments/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function TransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const paymentId = parseInt(id, 10);
      const foundPayment = paymentsRepo.getPayment(paymentId);
      if (foundPayment) {
        setPayment(foundPayment);
        setEvents(paymentsRepo.listEvents(paymentId));
        setNote(paymentsRepo.getNote(paymentId));
      }
      setLoading(false);
    }
  }, [id]);

  const handleSaveNote = () => {
    if (payment) {
      paymentsRepo.addNote(payment.id, note);
      toast.success("Nota salva!", {
        description: "A observação interna foi salva com sucesso.",
      });
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!", {
      description: "O ID do pagamento foi copiado para a área de transferência.",
    });
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!payment) {
    return <p>Pagamento não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold">Detalhes da Transação</h1>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(String(payment.id))}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-muted-foreground text-sm">Payment ID: {payment.id}</p>
            </div>
            <StatusBadge status={payment.status} statusDetail={payment.status_detail} />
        </div>

        <div className="flex items-center space-x-2">
            <Button disabled size="sm">
                Reembolsar
            </Button>
            <Button variant="outline" disabled size="sm">
                Cancelar
            </Button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p><strong>Valor:</strong> {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payment.transaction_amount)}</p>
                <p><strong>Método:</strong> {payment.payment_method_id}</p>
                <p><strong>Data de criação:</strong> {new Date(payment.date_created).toLocaleString()}</p>
                {payment.date_approved && <p><strong>Data de aprovação:</strong> {new Date(payment.date_approved).toLocaleString()}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pagador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Email:</strong> <span className="break-all">{payment.payer.email}</span></p>
              {payment.payer.first_name && <p><strong>Nome:</strong> {payment.payer.first_name}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Comprado</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <Link to={`/receitas/${payment.external_reference}`} className="text-primary hover:underline break-all">
                Ver receita: {payment.external_reference}
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>Criado: {new Date(payment.date_created).toLocaleString()}</li>
                {payment.date_approved && <li>Aprovado: {new Date(payment.date_approved).toLocaleString()}</li>}
                {payment.status === 'refunded' && <li>Reembolsado</li>}
                {payment.status === 'charged_back' && <li>Chargeback</li>}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Última sincronização: {events.length > 0 ? new Date(events[0].date_created).toLocaleString() : 'N/A'}</p>
              <ul className="space-y-2 mt-4">
                {events.map(event => (
                  <li key={event.id} className="text-sm">
                    Webhook recebido: {event.type} em {new Date(event.date_created).toLocaleString()}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Adicione uma nota interna sobre este pagamento..."
              />
              <Button onClick={handleSaveNote} size="sm">Salvar Nota</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
