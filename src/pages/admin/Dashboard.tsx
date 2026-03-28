import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  PlusCircle,
  List,
  Eye,
  FilePen,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
} from 'lucide-react';
import type { RecipeRecord } from '@/lib/recipes/types';
import { Button } from '@/components/ui/button';
import { getRecipes } from '@/lib/repos/recipeRepo';
import { paymentRepo } from '@/lib/repos/paymentRepo';
import type { Payment } from '@/lib/payments/types';
import { METHOD_LABELS } from '@/pages/admin/payments/constants';
import { getRecipeImage } from '@/lib/recipes/presentation';
import { buildTenantAdminPath, getCurrentTenantSlug } from '@/lib/tenant';
import { getAdminSnapshot, saveAdminSnapshot } from '@/pwa/offline/cache/admin-snapshot';
import { LastSyncBadge } from '@/pwa/offline/ui/LastSyncBadge';

type Period = '7' | '30' | '90';

const RevenueByDayChart = lazy(() =>
  import('@/pages/admin/dashboard/RevenueByDayChart').then((module) => ({ default: module.RevenueByDayChart }))
);

const PaymentMethodsChart = lazy(() =>
  import('@/pages/admin/dashboard/PaymentMethodsChart').then((module) => ({ default: module.PaymentMethodsChart }))
);

export default function Dashboard() {
  const location = useLocation();
  const tenantSlug = getCurrentTenantSlug(location.pathname);
  const [period, setPeriod] = useState<Period>('30');
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const days = Number(period);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [recipeRows, paymentRows] = await Promise.all([getRecipes(), paymentRepo.list()]);
        setRecipes(recipeRows);
        setAllPayments(paymentRows);
        setSnapshotMode(false);
        const syncedAt = new Date().toISOString();
        setLastSyncedAt(syncedAt);
        if (tenantSlug) {
          await saveAdminSnapshot({
            tenantSlug,
            dashboardSummary: {
              recipes: recipeRows,
              payments: paymentRows,
            },
            lastSyncedAt: syncedAt,
          });
        }
      } catch (error) {
        if (tenantSlug) {
          const snapshot = await getAdminSnapshot(tenantSlug);
          const summary = snapshot?.dashboardSummary as { recipes?: RecipeRecord[]; payments?: Payment[] } | undefined;
          if (summary) {
            setRecipes(summary.recipes || []);
            setAllPayments(summary.payments || []);
            setSnapshotMode(true);
            setLastSyncedAt(snapshot?.lastSyncedAt || null);
            return;
          }
        }
        console.error('Failed to load admin dashboard', error);
      }
    }

    void loadDashboard();
  }, [tenantSlug]);

  const published = recipes.filter((recipe) => recipe.status === 'published').length;
  const drafts = recipes.filter((recipe) => recipe.status === 'draft').length;

  const cutoff = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [days]);

  const payments = useMemo(
    () => allPayments.filter((payment) => new Date(payment.createdAt) >= cutoff),
    [allPayments, cutoff]
  );
  const approvedPayments = useMemo(
    () => payments.filter((payment) => payment.status === 'approved'),
    [payments]
  );

  const totalRevenue = approvedPayments.reduce((sum, payment) => sum + payment.totalBRL, 0);
  const avgTicket = approvedPayments.length > 0 ? totalRevenue / approvedPayments.length : 0;

  const stats = [
    {
      label: 'Receita Total',
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-500',
    },
    {
      label: 'Vendas Aprovadas',
      value: approvedPayments.length,
      icon: ShoppingCart,
      color: 'text-primary',
    },
    {
      label: 'Ticket Médio',
      value: `R$ ${avgTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-amber-500',
    },
    { label: 'Receitas Publicadas', value: published, icon: Eye, color: 'text-sky-500' },
    { label: 'Rascunhos', value: drafts, icon: FilePen, color: 'text-muted-foreground' },
    { label: 'Total Pagamentos', value: payments.length, icon: Users, color: 'text-violet-500' },
  ];

  const revenueByDay = useMemo(() => {
    const bucket: Record<string, number> = {};
    const now = new Date();
    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(date.getDate() - index);
      bucket[date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })] = 0;
    }
    approvedPayments.forEach((payment) => {
      const key = new Date(payment.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      if (key in bucket) bucket[key] += payment.totalBRL;
    });
    return Object.entries(bucket).map(([date, amount]) => ({
      date,
      amount: Number(amount.toFixed(2)),
    }));
  }, [approvedPayments, days]);

  const popularRecipes = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number }> = {};
    approvedPayments.forEach((payment) => {
      payment.items.forEach((item) => {
        if (!counts[item.slug]) counts[item.slug] = { count: 0, revenue: 0 };
        counts[item.slug].count += 1;
        counts[item.slug].revenue += item.priceBRL;
      });
    });
    return Object.entries(counts)
      .map(([slug, data]) => {
        const recipe = recipes.find((r) => r.slug === slug);
        return {
          slug,
          name: recipe?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          imageUrl: recipe ? getRecipeImage(recipe) : null,
          ...data,
        };
      })
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [approvedPayments, recipes]);

  const methodBreakdown = useMemo(() => {
    const methods: Record<string, number> = {};
    payments.forEach((payment) => {
      const label = METHOD_LABELS[payment.paymentMethodKey || 'pending'] || 'A definir';
      methods[label] = (methods[label] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const statusBreakdown = useMemo(() => {
    const statuses: Record<string, number> = {};
    payments.forEach((payment) => {
      const labels: Record<string, string> = {
        approved: 'Aprovado',
        pending: 'Pendente',
        rejected: 'Rejeitado',
        cancelled: 'Cancelado',
        refunded: 'Reembolsado',
        in_process: 'Em processo',
        charged_back: 'Chargeback',
      };
      const key = labels[payment.status] || payment.status;
      statuses[key] = (statuses[key] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const pieColors = [
    'hsl(var(--primary))',
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ef4444', // red-500
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Bem-vindo de volta! Aqui está o resumo do seu site.</p>
          {snapshotMode && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-amber-800">Modo offline — dados podem estar desatualizados.</p>
              <LastSyncBadge lastSyncedAt={lastSyncedAt} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-2xl border w-fit">
          {(['7', '30', '90'] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-4 h-9 text-xs transition-all ${period === p ? 'shadow-md' : ''}`}
            >
              {p} dias
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
            <div className="flex items-center justify-between">
              <div className={`rounded-2xl bg-muted/50 p-3 ${stat.color} transition-colors group-hover:bg-primary/10`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                +12%
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-3xl font-extrabold mt-1 tracking-tight">{stat.value}</h3>
            </div>
            <div className={`absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100`} />
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight">Receita no período</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span>Vendas aprovadas</span>
              </div>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="h-[320px] w-full animate-pulse rounded-2xl border border-dashed border-muted bg-muted/25" />
            }
          >
            <RevenueByDayChart data={revenueByDay} />
          </Suspense>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold tracking-tight mb-6">Receitas em destaque</h2>
          <div className="space-y-5 flex-1 overflow-y-auto pr-2">
            {popularRecipes.map((recipe, i) => (
              <div key={recipe.slug} className="group flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs font-bold bg-primary/10 text-primary">
                      {recipe.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-br-lg bg-black/80 text-[10px] font-bold text-white shadow-md">
                    {i + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold truncate leading-none mb-1 group-hover:text-primary transition-colors">
                    {recipe.name}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    {recipe.count} vendas · R$ {recipe.revenue.toFixed(2)}
                  </p>
                </div>
                <div className="h-8 w-1.5 rounded-full bg-primary/10 group-hover:bg-primary transition-colors" />
              </div>
            ))}
          </div>
          <Link to={buildTenantAdminPath('receitas', tenantSlug)} className="mt-6">
            <Button variant="outline" className="w-full rounded-2xl h-11 text-xs font-bold border-muted-foreground/20 hover:bg-muted/50">
              Ver todas as receitas
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight mb-6">Formas de Pagamento</h2>
          <Suspense
            fallback={
              <div className="h-[300px] w-full animate-pulse rounded-2xl border border-dashed border-muted bg-muted/25" />
            }
          >
            <PaymentMethodsChart methodBreakdown={methodBreakdown} pieColors={pieColors} />
          </Suspense>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight mb-6">Status das Transações</h2>
          <div className="space-y-4">
            {statusBreakdown.map((status, index) => {
              const percentage = (status.value / payments.length) * 100;
              return (
                <div key={status.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold">{status.name}</span>
                    <span className="text-muted-foreground">{status.value} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: pieColors[index % pieColors.length]
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 p-5 rounded-3xl bg-primary/5 border border-primary/10">
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight">Potencial de Crescimento</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Suas vendas aprovadas representam {((approvedPayments.length / (payments.length || 1)) * 100).toFixed(1)}% do total. Melhore seu checkout para aumentar esta taxa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-4">
        <Link to={buildTenantAdminPath('receitas/nova', tenantSlug)}>
          <Button className="w-full h-14 rounded-2xl gap-3 text-sm font-bold shadow-lg shadow-primary/20">
            <PlusCircle className="h-5 w-5" /> Criar Receita
          </Button>
        </Link>
        <Link to={buildTenantAdminPath('receitas', tenantSlug)}>
          <Button variant="secondary" className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted">
            <List className="h-5 w-5" /> Gerenciar Itens
          </Button>
        </Link>
        <Link to={buildTenantAdminPath('pagamentos/transacoes', tenantSlug)}>
          <Button variant="secondary" className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted">
            <DollarSign className="h-5 w-5" /> Relatório Financeiro
          </Button>
        </Link>
        <Link to={buildTenantAdminPath('newsletter', tenantSlug)}>
          <Button variant="secondary" className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted">
            <Users className="h-5 w-5" /> Audiência
          </Button>
        </Link>
      </div>
    </div>
  );
}
