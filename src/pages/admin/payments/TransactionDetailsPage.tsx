import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Payment, PaymentEvent, PaymentNote } from '@/lib/payments/types';
import { StatusBadge } from '@/components/payments/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { paymentRepo } from '@/lib/repos/paymentRepo';
import { METHOD_LABELS } from './constants';

export default function TransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [notes, setNotes] = useState<PaymentNote[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const paymentId = id;

    async function loadPayment() {
      setLoading(true);
      try {
        const details = await paymentRepo.getById(paymentId);
        setPayment(details.payment);
        setEvents(details.events);
        setNotes(details.notes);
      } catch (error) {
        console.error('Failed to load payment details', error);
      } finally {
        setLoading(false);
      }
    }

    void loadPayment();
  }, [id]);

  async function handleSaveNote() {
    if (!payment || !noteDraft.trim()) return;

    try {
      const note = await paymentRepo.addNote(payment.id, noteDraft.trim());
      setNotes((current) => [note, ...current]);
      setNoteDraft('');
      toast.success('Nota salva');
    } catch (error) {
      console.error('Failed to save payment note', error);
      toast.error('Nao foi possivel salvar a nota.');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  }

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
        <StatusBadge status={payment.status} statusDetail={payment.statusDetail} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Valor:</strong>{' '}
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  payment.totalBRL
                )}
              </p>
              <p>
                <strong>Método:</strong>{' '}
                {METHOD_LABELS[payment.paymentMethodKey || payment.paymentMethod] ||
                  payment.paymentMethod}
              </p>
              <p>
                <strong>Data de criação:</strong> {new Date(payment.createdAt).toLocaleString()}
              </p>
              {payment.approvedAt && (
                <p>
                  <strong>Data de aprovação:</strong>{' '}
                  {new Date(payment.approvedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pagador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Nome:</strong> {payment.payerName}
              </p>
              <p>
                <strong>Email:</strong> <span className="break-all">{payment.payerEmail}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Itens Comprados</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-2">
                {payment.items.map((item) => (
                  <Link
                    key={`${payment.id}-${item.recipeId}`}
                    to={`/receitas/${item.slug}`}
                    className="block text-primary hover:underline break-all"
                  >
                    {item.title} ·{' '}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      item.priceBRL
                    )}
                  </Link>
                ))}
              </div>
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
                <li>Criado: {new Date(payment.createdAt).toLocaleString()}</li>
                {payment.approvedAt && (
                  <li>Aprovado: {new Date(payment.approvedAt).toLocaleString()}</li>
                )}
                {payment.webhookReceivedAt && (
                  <li>Webhook: {new Date(payment.webhookReceivedAt).toLocaleString()}</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {events.length > 0 ? (
                  events.map((event) => (
                    <li key={event.id}>
                      {event.type} em {new Date(event.date_created).toLocaleString()}
                    </li>
                  ))
                ) : (
                  <li>Nenhum evento registrado.</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Adicione uma nota interna sobre este pagamento..."
              />
              <Button onClick={() => void handleSaveNote()} size="sm">
                Salvar Nota
              </Button>
              <div className="space-y-3">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-3 text-sm">
                      <p>{note.note}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma nota registrada.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
