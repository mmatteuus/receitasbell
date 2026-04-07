import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Payment, PaymentStatus } from '@/lib/payments/types';
import { exportPaymentsCSV, exportPaymentsPDF } from '@/lib/payments/export';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, FileText } from 'lucide-react';
import { paymentRepo } from '@/lib/repos/paymentRepo';
import { PageHead } from '@/components/PageHead';

const PaymentsTable = lazy(() =>
  import('@/components/payments/PaymentsTable').then((module) => ({
    default: module.PaymentsTable,
  }))
);

const statusOptions: { label: string; value: PaymentStatus }[] = [
  { label: 'Aprovado', value: 'approved' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Processando', value: 'in_process' },
  { label: 'Rejeitado', value: 'rejected' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Devolvido', value: 'refunded' },
  { label: 'Chargeback', value: 'charged_back' },
];

const methodOptions = [
  { label: 'PIX', value: 'pix' },
  { label: 'Cartão de Crédito', value: 'credit_card' },
  { label: 'Boleto', value: 'boleto' },
  { label: 'A definir', value: 'pending' },
];

export default function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('email');
  const [status, setStatus] = useState<PaymentStatus[]>(() => {
    const value = searchParams.get('status');
    return value ? (value.split(',') as PaymentStatus[]) : [];
  });
  const [methods, setMethods] = useState<string[]>(() => {
    const value = searchParams.get('method');
    return value ? value.split(',') : [];
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  function calculateTotals(paymentsList: Payment[]) {
    return {
      count: paymentsList.length,
      total: paymentsList.reduce((sum, payment) => sum + payment.totalBRL, 0),
      approved: paymentsList
        .filter((payment) => payment.status === 'approved')
        .reduce((sum, payment) => sum + payment.totalBRL, 0),
    };
  }

  const loadPayments = useCallback(
    async (
      filters: {
        status?: PaymentStatus[];
        paymentMethod?: string[];
        email?: string;
        paymentId?: string;
        externalReference?: string;
        dateFrom?: string;
        dateTo?: string;
      } = {}
    ) => {
      setLoading(true);
      try {
        const next = await paymentRepo.list({
          status: filters.status,
          paymentMethod: filters.paymentMethod,
          email: filters.email,
          paymentId: filters.paymentId,
          externalReference: filters.externalReference,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        });
        setPayments(next);
      } catch (error) {
        console.error('Failed to load payments', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const initialStatus = searchParams.get('status');
    const initialMethod = searchParams.get('method');
    void loadPayments({
      status: initialStatus ? (initialStatus.split(',') as PaymentStatus[]) : undefined,
      paymentMethod: initialMethod ? initialMethod.split(',') : undefined,
    });
  }, [loadPayments, searchParams]);

  function handleFilter() {
    void loadPayments({
      status,
      paymentMethod: methods,
      email: searchField === 'email' ? search : undefined,
      paymentId: searchField === 'paymentId' ? search : undefined,
      externalReference: searchField === 'external_reference' ? search : undefined,
      dateFrom: dateRange?.from?.toISOString(),
      dateTo: dateRange?.to?.toISOString(),
    });
  }

  function clearFilters() {
    setSearch('');
    setSearchField('email');
    setStatus([]);
    setMethods([]);
    setDateRange(undefined);
    void loadPayments();
  }

  const totals = calculateTotals(payments);

  return (
    <>
      <PageHead
        title="Transações"
        description="Filtre, analise e exporte todas as transações do sistema."
        noindex={true}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe pagamentos, filtre por período e abra os detalhes sem depender de planilhas no
            front.
          </p>
        </div>

        {!loading && payments.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total de Transações</p>
              <p className="text-2xl font-bold">{totals.count}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totals.total
                )}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Valor Aprovado</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totals.approved
                )}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_220px_220px_minmax(0,1fr)]">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="search">Pesquisar</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="search"
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Buscar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="paymentId">Payment ID</SelectItem>
                  <SelectItem value="external_reference">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label>Status</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {status.length > 0 ? `${status.length} selecionado(s)` : 'Selecionar Status'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {statusOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={status.includes(option.value)}
                    onCheckedChange={(checked) => {
                      setStatus((current) =>
                        checked
                          ? [...current, option.value]
                          : current.filter((item) => item !== option.value)
                      );
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label>Método</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {methods.length > 0 ? `${methods.length} selecionado(s)` : 'Selecionar Método'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {methodOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={methods.includes(option.value)}
                    onCheckedChange={(checked) => {
                      setMethods((current) =>
                        checked
                          ? [...current, option.value]
                          : current.filter((item) => item !== option.value)
                      );
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label>Período</Label>
            <DatePickerWithRange onSelect={setDateRange} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button className="w-full sm:w-auto" onClick={handleFilter}>
            Filtrar
          </Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={clearFilters}>
            Limpar Filtros
          </Button>
          <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPaymentsCSV(payments)}
              className="w-full gap-1.5 sm:w-auto"
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPaymentsPDF(payments)}
              className="w-full gap-1.5 sm:w-auto"
            >
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Carregando transações...
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                Preparando tabela de transações...
              </div>
            }
          >
            <PaymentsTable data={payments} />
          </Suspense>
        )}
      </div>
    </>
  );
}
