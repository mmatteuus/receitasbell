import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentRepo } from '@/lib/repos/paymentRepo';
import type { Payment } from '@/lib/payments/types';
import { exportPaymentsCSV, exportPaymentsPDF } from '@/lib/payments/export';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Download, FileText, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { COLORS, METHOD_LABELS, STATUS_LABELS, STATUS_LABELS_REVERSE } from './constants';
import { KPICards } from './KPICards';
import type { MethodChartClickData, StatusChartClickData } from './charts/MethodsChart';
import { buildTenantAdminPath, getCurrentTenantSlug } from '@/lib/tenant';
import type { FinancialDashboardStats } from './FinancialDashboard';
import { getAdminSnapshot, saveAdminSnapshot } from '@/pwa/offline/cache/admin-snapshot';

import { getAdminPaymentSettings } from '@/lib/api/payments';
import type { AdminPaymentSettingsResponse } from '@/types/payment';
import { PageHead } from '@/components/PageHead';

const TrendsChart = lazy(() =>
  import('./charts/TrendsChart').then((module) => ({ default: module.TrendsChart }))
);
const SuccessRateChart = lazy(() =>
  import('./charts/SuccessRateChart').then((module) => ({ default: module.SuccessRateChart }))
);
const MethodsChart = lazy(() =>
  import('./charts/MethodsChart').then((module) => ({ default: module.MethodsChart }))
);
const MonthlyChart = lazy(() =>
  import('./charts/MonthlyChart').then((module) => ({ default: module.MonthlyChart }))
);
const FinancialDashboard = lazy(() => import('./FinancialDashboard'));

function AnalyticsPanelFallback({ label }: { label: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
      Carregando {label.toLowerCase()}...
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tenantSlug = getCurrentTenantSlug(location.pathname);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);
    return { from, to };
  });
  const [stripeStatus, setStripeStatus] = useState<AdminPaymentSettingsResponse | null>(null);

  useEffect(() => {
    async function loadPaymentsForDashboard() {
      try {
        setLoadingPayments(true);
        const filtered = await paymentRepo.list({
          dateFrom: dateRange?.from?.toISOString(),
          dateTo: dateRange?.to?.toISOString(),
        });
        setPayments(filtered);
        setSnapshotMode(false);
        const syncedAt = new Date().toISOString();
        setLastSyncedAt(syncedAt);
        if (tenantSlug) {
          await saveAdminSnapshot({
            tenantSlug,
            paymentsSummary: {
              payments: filtered,
            },
            lastSyncedAt: syncedAt,
          });
        }
      } catch (error) {
        if (tenantSlug) {
          const snapshot = await getAdminSnapshot(tenantSlug);
          const summary = snapshot?.paymentsSummary as { payments?: Payment[] } | undefined;
          if (summary?.payments) {
            setPayments(summary.payments);
            setSnapshotMode(true);
            setLastSyncedAt(snapshot?.lastSyncedAt || null);
          } else {
            console.error('Failed to load payments dashboard', error);
          }
        } else {
          console.error('Failed to load payments dashboard', error);
        }
      } finally {
        setLoadingPayments(false);
      }
    }

    void loadPaymentsForDashboard();
  }, [dateRange, tenantSlug]);

  useEffect(() => {
    async function loadStripeStatus() {
      try {
        const status = await getAdminPaymentSettings();
        setStripeStatus(status);
      } catch (error) {
        console.error('Failed to load Stripe status on dashboard', error);
      }
    }
    void loadStripeStatus();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce(
      (acc, p) => (p.status === 'approved' ? acc + p.totalBRL : acc),
      0
    );
    const total = payments.length;
    const approved = payments.filter((p) => p.status === 'approved').length;
    const pending = payments.filter(
      (p) => p.status === 'pending' || p.status === 'in_process'
    ).length;
    const refunded = payments.filter(
      (p) => p.status === 'refunded' || p.status === 'charged_back'
    ).length;
    const rejected = payments.filter(
      (p) => p.status === 'rejected' || p.status === 'cancelled'
    ).length;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;
    const avgTicket = approved > 0 ? totalRevenue / approved : 0;
    return { totalRevenue, total, approved, pending, refunded, rejected, approvalRate, avgTicket };
  }, [payments]);

  const revenueByDay = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    payments.forEach((p) => {
      if (p.status === 'approved' && p.approvedAt) {
        const day = new Date(p.approvedAt).toISOString().split('T')[0];
        if (!map[day]) map[day] = { revenue: 0, count: 0 };
        map[day].revenue += p.totalBRL;
        map[day].count += 1;
      }
    });
    return Object.entries(map)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [payments]);

  const successRateByDay = useMemo(() => {
    const map: Record<string, { total: number; approved: number }> = {};
    payments.forEach((p) => {
      const day = new Date(p.createdAt).toISOString().split('T')[0];
      if (!map[day]) map[day] = { total: 0, approved: 0 };
      map[day].total += 1;
      if (p.status === 'approved') map[day].approved += 1;
    });
    return Object.entries(map)
      .map(([date, data]) => ({
        date,
        rate: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0,
        total: data.total,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [payments]);

  const revenueByMethod = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    payments.forEach((p) => {
      if (p.status === 'approved') {
        const method = p.paymentMethodKey;
        if (!map[method]) map[method] = { revenue: 0, count: 0 };
        map[method].revenue += p.totalBRL;
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
    payments.forEach((p) => {
      map[p.status] = (map[p.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name: STATUS_LABELS[name] || name,
      statusKey: name,
      value,
      color: COLORS[name] || 'hsl(0,0%,50%)',
    }));
  }, [payments]);

  const monthlyComparison = useMemo(() => {
    const map: Record<string, { revenue: number; count: number; approved: number }> = {};
    payments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { revenue: 0, count: 0, approved: 0 };
      map[key].count += 1;
      if (p.status === 'approved') {
        map[key].revenue += p.totalBRL;
        map[key].approved += 1;
      }
    });
    return Object.entries(map)
      .map(([month, data]) => ({
        month,
        label: new Date(month + '-15').toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        }),
        ...data,
        avgTicket: data.approved > 0 ? data.revenue / data.approved : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [payments]);

  const stripeSummary = useMemo<FinancialDashboardStats>(() => {
    const approvedPayments = payments.filter((payment) => payment.status === 'approved');
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const totalRevenue = approvedPayments.reduce((sum, payment) => sum + payment.totalBRL, 0);
    const monthlyRevenue = approvedPayments.reduce((sum, payment) => {
      const referenceDate = payment.approvedAt ?? payment.createdAt;
      return new Date(referenceDate) >= startOfMonth ? sum + payment.totalBRL : sum;
    }, 0);
    const recentPayments = [...payments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((payment) => ({
        id: payment.id,
        amount: payment.totalBRL,
        status: payment.status,
        buyerEmail: payment.payer?.email || payment.payerEmail,
        createdAt: payment.createdAt,
        method: payment.paymentMethodKey || payment.paymentMethod || null,
      }));

    return {
      totalRevenue,
      monthlyRevenue,
      recentPayments,
      stripeStatus: stripeStatus
        ? {
            connected: stripeStatus.connectionStatus === 'connected',
            detailsSubmitted: stripeStatus.detailsSubmitted ?? false,
            chargesEnabled: stripeStatus.chargesEnabled ?? false,
          }
        : undefined,
    };
  }, [payments, stripeStatus]);

  const setQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateRange({ from, to });
  };

  const handleStatusBarClick = useCallback(
    (data?: StatusChartClickData) => {
      if (!data) return;
      const statusKey =
        data.statusKey ||
        data.payload?.statusKey ||
        STATUS_LABELS_REVERSE[data.name || data.payload?.name || ''];
      if (statusKey) {
        navigate(
          `${buildTenantAdminPath('pagamentos/transacoes', tenantSlug)}?status=${statusKey}`
        );
        toast.info(`Filtrando transações por: ${STATUS_LABELS[statusKey] || statusKey}`);
      }
    },
    [navigate, tenantSlug]
  );

  const handleMethodBarClick = useCallback(
    (data?: MethodChartClickData) => {
      if (!data) return;
      const method = data.method || data.payload?.method;
      if (method) {
        navigate(`${buildTenantAdminPath('pagamentos/transacoes', tenantSlug)}?method=${method}`);
        toast.info(`Filtrando transações por: ${METHOD_LABELS[method] || method}`);
      }
    },
    [navigate, tenantSlug]
  );

  return (
    <>
      <PageHead
        title="Analytics de pagamentos"
        description="Visualize métricas e tendências financeiras do seu painel."
        noindex={true}
      />
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics de Pagamentos</h1>
            {snapshotMode && (
              <div className="mt-2 space-y-2">
                <p className="text-sm font-medium text-amber-800">
                  Modo offline — dados podem estar desatualizados.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DatePickerWithRange onSelect={setDateRange} />
            <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
              7d
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
              30d
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>
              90d
            </Button>
            <div className="h-6 w-px bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(buildTenantAdminPath('pagamentos/configuracoes', tenantSlug))}
              className="gap-1.5"
            >
              <Settings className="h-4 w-4" /> Config.
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPaymentsCSV(payments, 'analytics')}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPaymentsPDF(payments, 'analytics')}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        <KPICards stats={stats} />

        <Tabs defaultValue="stripe" className="space-y-4 md:block hidden">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="success">Taxa de Sucesso</TabsTrigger>
            <TabsTrigger value="methods">Por Método</TabsTrigger>
            <TabsTrigger value="monthly">Mês a Mês</TabsTrigger>
            <TabsTrigger value="stripe" className="text-[#635BFF] font-semibold">
              Resumo Stripe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="animate-fade-in">
            <Suspense fallback={<AnalyticsPanelFallback label="tendencias" />}>
              <TrendsChart data={revenueByDay} />
            </Suspense>
          </TabsContent>

          <TabsContent value="success" className="animate-fade-in">
            <Suspense fallback={<AnalyticsPanelFallback label="taxa de sucesso" />}>
              <SuccessRateChart data={successRateByDay} />
            </Suspense>
          </TabsContent>

          <TabsContent value="methods" className="animate-fade-in">
            <Suspense fallback={<AnalyticsPanelFallback label="graficos por metodo" />}>
              <MethodsChart
                revenueByMethod={revenueByMethod}
                statusDistribution={statusDistribution}
                onMethodClick={handleMethodBarClick}
                onStatusClick={handleStatusBarClick}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="monthly" className="animate-fade-in">
            <Suspense fallback={<AnalyticsPanelFallback label="comparacao mensal" />}>
              <MonthlyChart data={monthlyComparison} />
            </Suspense>
          </TabsContent>

          <TabsContent value="stripe" className="animate-fade-in">
            <Suspense fallback={<AnalyticsPanelFallback label="resumo do Stripe" />}>
              <FinancialDashboard stats={stripeSummary} loading={loadingPayments} />
            </Suspense>
          </TabsContent>
        </Tabs>

        <div className="md:hidden block">
          <Suspense fallback={<AnalyticsPanelFallback label="resumo do Stripe" />}>
            <FinancialDashboard stats={stripeSummary} loading={loadingPayments} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
