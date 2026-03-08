
import { useEffect, useState } from "react";
import { Payment, PaymentStatus } from "@/lib/payments/types";
import { paymentsRepo } from "@/lib/payments/repo";
import { exportPaymentsCSV, exportPaymentsPDF } from "@/lib/payments/export";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileText } from "lucide-react";

const statusOptions: { label: string, value: PaymentStatus }[] = [
    { label: "Aprovado", value: "approved" },
    { label: "Pendente", value: "pending" },
    { label: "Processando", value: "in_process" },
    { label: "Rejeitado", value: "rejected" },
    { label: "Cancelado", value: "cancelled" },
    { label: "Devolvido", value: "refunded" },
    { label: "Chargeback", value: "charged_back" },
];

export default function TransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("email");
  const [status, setStatus] = useState<PaymentStatus[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleFilter = () => {
    setLoading(true);
    const filters = {
        [searchField]: search,
        status: status,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString(),
    }
    const filteredPayments = paymentsRepo.listPayments(filters);
    setPayments(filteredPayments);
    setLoading(false);
  }

  const clearFilters = () => {
    setLoading(true);
    setSearch("");
    setSearchField("email");
    setStatus([]);
    setDateRange(undefined);
    setPayments(paymentsRepo.listPayments());
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    const allPayments = paymentsRepo.listPayments();
    setPayments(allPayments);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transações</h1>

      <div className="flex items-center space-x-2">
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="search">Pesquisar</Label>
            <div className="flex w-full max-w-sm items-center space-x-2">
                <Input id="search" type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}/>
                <Select value={searchField} onValueChange={setSearchField}>
                    <SelectTrigger className="w-[180px]">
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

        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>Status</Label>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                        Selecionar Status
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    {statusOptions.map(option => (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={status.includes(option.value)}
                            onCheckedChange={(checked) => {
                                setStatus(prev => checked ? [...prev, option.value] : prev.filter(s => s !== option.value))
                            }}
                        >
                            {option.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>Período</Label>
            <DatePickerWithRange onSelect={setDateRange} />
        </div>
      </div>
        <div className="flex items-center space-x-2">
            <Button onClick={handleFilter}>Filtrar</Button>
            <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
        </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <PaymentsTable data={payments} />
      )}
    </div>
  );
}
