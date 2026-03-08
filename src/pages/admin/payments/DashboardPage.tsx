
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { paymentsRepo } from "@/lib/payments/repo";
import { Payment } from "@/lib/payments/types";
import { exportPaymentsCSV, exportPaymentsPDF } from "@/lib/payments/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area,
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid
} from 'recharts';
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Download, FileText, DollarSign, CheckCircle, Clock, RotateCcw, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import html2canvas from "html2canvas";

const formatBRL = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const COLORS = {
  approved: 'hsl(142, 71%, 45%)',
  pending: 'hsl(45, 93%, 47%)',
  in_process: 'hsl(199, 89%, 48%)',
  rejected: 'hsl(0, 84%, 60%)',
  cancelled: 'hsl(0, 0%, 60%)',
  refunded: 'hsl(262, 83%, 58%)',
  charged_back: 'hsl(330, 81%, 60%)',
};

const METHOD_COLORS = {
  pix: 'hsl(168, 76%, 42%)',
  credit_card: 'hsl(221, 83%, 53%)',
  boleto: 'hsl(25, 95%, 53%)',
};

const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto',
};

const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  in_process: 'Em Processo',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Chargeback',
};

const STATUS_LABELS_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([k, v]) => [v, k])
);

async function exportChartAsPNG(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
  if (!ref.current) return;
  try {
    const canvas = await html2canvas(ref.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Gráfico exportado como PNG");
  } catch {
    toast.error("Erro ao exportar gráfico");
  }
}

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

  const chartRefTrends = useRef<HTMLDivElement>(null);
  const chartRefSuccess = useRef<HTMLDivElement>(null);
  const chartRefMethods = useRef<HTMLDivElement>(null);
  const chartRefMonthly = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const filtered = paymentsRepo.listPayments({
      dateFrom: dateRange?.from?.toISOString(),
      dateTo: dateRange?.to?.toISOString(),
    });
    setPayments(filtered);
    setLoading(false);
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
      method,
      label: METHOD_LABELS[method] || method,
      ...data,
    }));
  }, [payments]);

  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({
      name: STATUS_LABELS[name] || name,
      statusKey: name,
      value,
      color: COLORS[name as keyof typeof COLORS] || 'hsl(0,0%,50%)',
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

  const handleStatusBarClick = useCallback((data: any) => {
    if (!data) return;
    const statusKey = data.statusKey || STATUS_LABELS_REVERSE[data.name];
    if (statusKey) {
      navigate(`/admin/pagamentos/transacoes?status=${statusKey}`);
      toast.info(`Filtrando transações por: ${STATUS_LABELS[statusKey] || statusKey}`);
    }
  }, [navigate]);

  const handleMethodBarClick = useCallback((data: any) => {
    if (!data) return;
    const method = data.method;
    if (method) {
      navigate(`/admin/pagamentos/transacoes?method=${method}`);
      toast.info(`Filtrando transações por: ${METHOD_LABELS[method] || method}`);
    }
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatBRL(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ticket médio: {formatBRL(stats.avgTicket)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.approved} de {stats.total} transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Rejeitados: {stats.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reembolsos</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.refunded}</div>
            <p className="text-xs text-muted-foreground mt-1">Total: {stats.total} transações</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="success">Taxa de Sucesso</TabsTrigger>
          <TabsTrigger value="methods">Por Método</TabsTrigger>
          <TabsTrigger value="monthly">Mês a Mês</TabsTrigger>
        </TabsList>

        {/* Revenue Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Tendência de Receita</CardTitle>
                <CardDescription>Receita aprovada por dia no período selecionado</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => exportChartAsPNG(chartRefTrends, "tendencia-receita")} title="Exportar como PNG">
                <Camera className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent ref={chartRefTrends}>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={(str) => new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} className="text-muted-foreground" />
                  <YAxis tickFormatter={(val) => formatBRL(val)} width={90} className="text-muted-foreground" />
                  <Tooltip
                    formatter={(val: number) => [formatBRL(val), 'Receita']}
                    labelFormatter={(label) => new Date(label + 'T12:00:00').toLocaleDateString('pt-BR')}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Success Rate */}
        <TabsContent value="success">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Taxa de Sucesso por Dia</CardTitle>
                <CardDescription>Percentual de transações aprovadas em relação ao total diário</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => exportChartAsPNG(chartRefSuccess, "taxa-sucesso")} title="Exportar como PNG">
                <Camera className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent ref={chartRefSuccess}>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={successRateByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={(str) => new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                  <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    formatter={(val: number, name: string) => {
                      if (name === 'rate') return [`${val}%`, 'Taxa de Aprovação'];
                      return [val, 'Total de Transações'];
                    }}
                    labelFormatter={(label) => new Date(label + 'T12:00:00').toLocaleDateString('pt-BR')}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend formatter={(value) => value === 'rate' ? 'Taxa de Aprovação (%)' : 'Total de Transações'} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} yAxisId="right" />
                  <YAxis yAxisId="right" orientation="right" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue by Method */}
        <TabsContent value="methods">
          <div className="grid gap-4 md:grid-cols-2" ref={chartRefMethods}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Receita por Método</CardTitle>
                  <CardDescription>Clique em uma fatia para filtrar transações</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByMethod}
                      dataKey="revenue"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                      onClick={handleMethodBarClick}
                      className="cursor-pointer"
                    >
                      {revenueByMethod.map((entry) => (
                        <Cell key={entry.method} fill={METHOD_COLORS[entry.method as keyof typeof METHOD_COLORS] || 'hsl(0,0%,60%)'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => [formatBRL(val), 'Receita']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Volume por Método</CardTitle>
                <CardDescription>Clique em uma barra para filtrar transações</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByMethod}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip
                      formatter={(val: number, name: string) => {
                        if (name === 'revenue') return [formatBRL(val), 'Receita'];
                        return [val, 'Transações'];
                      }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" name="Transações" radius={[4, 4, 0, 0]} onClick={handleMethodBarClick} className="cursor-pointer">
                      {revenueByMethod.map((entry) => (
                        <Cell key={entry.method} fill={METHOD_COLORS[entry.method as keyof typeof METHOD_COLORS] || 'hsl(0,0%,60%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Distribuição de Status</CardTitle>
                  <CardDescription>Clique em uma barra para filtrar transações por status</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => exportChartAsPNG(chartRefMethods, "metodos-pagamento")} title="Exportar como PNG">
                  <Camera className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" name="Transações" radius={[0, 4, 4, 0]} onClick={handleStatusBarClick} className="cursor-pointer">
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
