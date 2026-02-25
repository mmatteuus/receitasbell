
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Payment, PaymentEvent } from "@/lib/payments/types";
import { paymentsRepo } from "@/lib/payments/repo";
import { StatusBadge } from "@/components/payments/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Copy } from "lucide-react";

export default function TransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

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
      toast({
        title: "Nota salva!",
        description: "A observação interna foi salva com sucesso.",
      });
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "O ID do pagamento foi copiado para a área de transferência.",
    });
  }

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!payment) {
    return <p>Pagamento não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">Detalhes da Transação</h1>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(String(payment.id))}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-muted-foreground">Payment ID: {payment.id}</p>
            </div>
            <StatusBadge status={payment.status} statusDetail={payment.status_detail} />
        </div>

        <div className="flex items-center space-x-2">
            <Button disabled>
                Reembolsar
            </Button>
            <Button variant="outline" disabled>
                Cancelar
            </Button>
        </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p><strong>Valor:</strong> {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payment.transaction_amount)}</p>
                <p><strong>Método:</strong> {payment.payment_method_id}</p>
                <p><strong>Data de criação:</strong> {new Date(payment.date_created).toLocaleString()}</p>
                {payment.date_approved && <p><strong>Data de aprovação:</strong> {new Date(payment.date_approved).toLocaleString()}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Email:</strong> {payment.payer.email}</p>
              {payment.payer.first_name && <p><strong>Nome:</strong> {payment.payer.first_name}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Item Comprado</CardTitle>
            </CardHeader>
            <CardContent>
              <Link to={`/receitas/${payment.external_reference}`} className="text-blue-500 hover:underline">
                Ver receita: {payment.external_reference}
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>Criado: {new Date(payment.date_created).toLocaleString()}</li>
                {payment.date_approved && <li>Aprovado: {new Date(payment.date_approved).toLocaleString()}</li>}
                {payment.status === 'refunded' && <li>Reembolsado</li>}
                {payment.status === 'charged_back' && <li>Chargeback</li>}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Última sincronização: {events.length > 0 ? new Date(events[0].date_created).toLocaleString() : 'N/A'}</p>
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
              <CardTitle>Observações Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Adicione uma nota interna sobre este pagamento..."
              />
              <Button onClick={handleSaveNote}>Salvar Nota</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
