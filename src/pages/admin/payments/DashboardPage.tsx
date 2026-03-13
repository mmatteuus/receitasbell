import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listPayments } from "@/lib/api/payments";
import { Payment } from "@/lib/payments/types";
import { exportPaymentsCSV, exportPaymentsPDF } from "@/lib/payments/export";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Download, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatBRL, COLORS, METHOD_LABELS, STATUS_LABELS, STATUS_LABELS_REVERSE } from "./constants";
import { KPICards } from "./KPICards";
import { TrendsChart } from "./charts/TrendsChart";
import { SuccessRateChart } from "./charts/SuccessRateChart";
import { MethodsChart } from "./charts/MethodsChart";
import { MonthlyChart } from "./charts/MonthlyChart";
import type { MethodChartClickData, StatusChartClickData } from "./charts/MethodsChart";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);
    return { from, to };
  });

  useEffect(() => {
    async function loadPaymentsForDashboard() {
      setLoading(true);
      try {
        const filtered = await listPayments({
          dateFrom: dateRange?.from?.toISOString(),
          dateTo: dateRange?.to?.toISOString(),
        });
        setPayments(filtered);
      } catch (error) {
        console.error("Failed to load payments dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    void loadPaymentsForDashboard();
  }, [dateRange]);

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => p.status === 'approved' ? acc + p.transaction_amount : acc, 0);
    const total = payments.length;
    const approved = payments.filter(p => p.status === 'approved').length;
    const pending = payments.filter(p => p.status === 'pending' || p.status === 'in_process').length;
    const refunded = payments.filter(p => p.status === 'refunded' || p.status === 'charged_back').length;
    const rejected = payments.filter(p => p.status === 'rejected' || p.status === 'cancelled').length;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;
    const avgTicket = approved > 0 ? totalRevenue / approved : 0;
    return { totalRevenue, total, approved, pending, refunded, rejected, approvalRate, avgTicket };
  }, [payments]);

  const revenueByDay = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    payments.forEach(p => {
      if (p.status === 'approved' && p.date_approved) {
        const day = new Date(p.date_approved).toISOString().split('T')[0];
        if (!map[day]) map[day] = { revenue: 0, count: 0 };
        map[day].revenue += p.transaction_amount;
        map[day].count += 1;
      }
    });
    return Object.entries(map).map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [payments]);

  const successRateByDay = useMemo(() => {
    const map: Record<string, { total: number; approved: number }> = {};
    payments.forEach(p => {
      const day = new Date(p.date_created).toISOString().split('T')[0];
      if (!map[day]) map[day] = { total: 0, approved: 0 };
      map[day].total += 1;
      if (p.status === 'approved') map[day].approved += 1;
    });
    return Object.entries(map).map(([date, data]) => ({
      date,
      rate: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0,
      total: data.total,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [payments]);

  const revenueByMethod = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    payments.forEach(p => {
      if (p.status === 'approved') {
        const method = p.payment_method_id;
        if (!map[method]) map[method] = { revenue: 0, count: 0 };
        map[method].revenue += p.transaction_amount;
        map[method].count += 1;
      }
    });
    return Object.entries(map).map(([method, data]) => ({
      method, label: METHOD_LABELS[method] || method, ...data,
    }));
  }, [payments]);

  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({
      name: STATUS_LABELS[name] || name, statusKey: name, value,
      color: COLORS[name] || 'hsl(0,0%,50%)',
    }));
  }, [payments]);

  const monthlyComparison = useMemo(() => {
    const map: Record<string, { revenue: number; count: number; approved: number }> = {};
    payments.forEach(p => {
      const d = new Date(p.date_created);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { revenue: 0, count: 0, approved: 0 };
      map[key].count += 1;
      if (p.status === 'approved') {
        map[key].revenue += p.transaction_amount;
        map[key].approved += 1;
      }
    });
    return Object.entries(map)
      .map(([month, data]) => ({
        month,
        label: new Date(month + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        ...data,
        avgTicket: data.approved > 0 ? data.revenue / data.approved : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [payments]);

  const setQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateRange({ from, to });
  };

  const handleStatusBarClick = useCallback((data?: StatusChartClickData) => {
    if (!data) return;
    const statusKey = data.statusKey || data.payload?.statusKey || STATUS_LABELS_REVERSE[data.name || data.payload?.name || ""];
    if (statusKey) {
      navigate(`/admin/pagamentos/transacoes?status=${statusKey}`);
      toast.info(`Filtrando transações por: ${STATUS_LABELS[statusKey] || statusKey}`);
    }
  }, [navigate]);

  const handleMethodBarClick = useCallback((data?: MethodChartClickData) => {
    if (!data) return;
    const method = data.method || data.payload?.method;
    if (method) {
      navigate(`/admin/pagamentos/transacoes?method=${method}`);
      toast.info(`Filtrando transações por: ${METHOD_LABELS[method] || method}`);
    }
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Analytics de Pagamentos</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <DatePickerWithRange onSelect={setDateRange} />
          <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>7d</Button>
          <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>30d</Button>
          <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>90d</Button>
          <div className="h-6 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={() => exportPaymentsCSV(payments, "analytics")} className="gap-1.5">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPaymentsPDF(payments, "analytics")} className="gap-1.5">
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <KPICards stats={stats} />

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="success">Taxa de Sucesso</TabsTrigger>
          <TabsTrigger value="methods">Por Método</TabsTrigger>
          <TabsTrigger value="monthly">Mês a Mês</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="animate-fade-in">
          <TrendsChart data={revenueByDay} />
        </TabsContent>

        <TabsContent value="success" className="animate-fade-in">
          <SuccessRateChart data={successRateByDay} />
        </TabsContent>

        <TabsContent value="methods" className="animate-fade-in">
          <MethodsChart
            revenueByMethod={revenueByMethod}
            statusDistribution={statusDistribution}
            onMethodClick={handleMethodBarClick}
            onStatusClick={handleStatusBarClick}
          />
        </TabsContent>

        <TabsContent value="monthly" className="animate-fade-in">
          <MonthlyChart data={monthlyComparison} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
