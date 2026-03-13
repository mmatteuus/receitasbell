import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle, List, Eye, FilePen,
  DollarSign, TrendingUp, Users, ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getRecipes } from "@/lib/repos/recipeRepo";
import { listPayments } from "@/lib/api/payments";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
  ResponsiveContainer,
} from "recharts";
import type { Recipe } from "@/types/recipe";
import type { Payment } from "@/lib/payments/types";

type Period = "7" | "30" | "90";

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("30");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const days = Number(period);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [recipeRows, paymentRows] = await Promise.all([
          getRecipes(),
          listPayments(),
        ]);
        setRecipes(recipeRows);
        setAllPayments(paymentRows);
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      }
    }

    void loadDashboard();
  }, []);

  const published = recipes.filter((recipe) => recipe.status === "published").length;
  const drafts = recipes.filter((recipe) => recipe.status === "draft").length;

  const cutoff = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [days]);

  const payments = useMemo(
    () => allPayments.filter((payment) => new Date(payment.date_created) >= cutoff),
    [allPayments, cutoff],
  );
  const approvedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "approved"),
    [payments],
  );

  const totalRevenue = approvedPayments.reduce((sum, payment) => sum + payment.transaction_amount, 0);
  const avgTicket = approvedPayments.length > 0 ? totalRevenue / approvedPayments.length : 0;

  const stats = [
    { label: "Receita Total", value: `R$ ${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-500" },
    { label: "Vendas Aprovadas", value: approvedPayments.length, icon: ShoppingCart, color: "text-primary" },
    { label: "Ticket Médio", value: `R$ ${avgTicket.toFixed(2)}`, icon: TrendingUp, color: "text-amber-500" },
    { label: "Receitas Publicadas", value: published, icon: Eye, color: "text-sky-500" },
    { label: "Rascunhos", value: drafts, icon: FilePen, color: "text-muted-foreground" },
    { label: "Total Pagamentos", value: payments.length, icon: Users, color: "text-violet-500" },
  ];

  const revenueByDay = useMemo(() => {
    const bucket: Record<string, number> = {};
    const now = new Date();
    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(date.getDate() - index);
      bucket[date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })] = 0;
    }
    approvedPayments.forEach((payment) => {
      const key = new Date(payment.date_created).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (key in bucket) bucket[key] += payment.transaction_amount;
    });
    return Object.entries(bucket).map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }));
  }, [approvedPayments, days]);

  const popularRecipes = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number }> = {};
    approvedPayments.forEach((payment) => {
      if (!counts[payment.external_reference]) counts[payment.external_reference] = { count: 0, revenue: 0 };
      counts[payment.external_reference].count += 1;
      counts[payment.external_reference].revenue += payment.transaction_amount;
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ name: name.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), ...data }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 7);
  }, [approvedPayments]);

  const methodBreakdown = useMemo(() => {
    const methods: Record<string, number> = {};
    payments.forEach((payment) => {
      const label = payment.payment_method_id === "pix" ? "PIX" : payment.payment_method_id === "credit_card" ? "Cartão" : "Boleto";
      methods[label] = (methods[label] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const statusBreakdown = useMemo(() => {
    const statuses: Record<string, number> = {};
    payments.forEach((payment) => {
      const labels: Record<string, string> = {
        approved: "Aprovado",
        pending: "Pendente",
        rejected: "Rejeitado",
        cancelled: "Cancelado",
        refunded: "Reembolsado",
        in_process: "Em processo",
        charged_back: "Chargeback",
      };
      const key = labels[payment.status] || payment.status;
      statuses[key] = (statuses[key] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const pieColors = [
    "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))",
    "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(270 70% 60%)",
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Visão geral do seu site de receitas</p>
        </div>
        <ToggleGroup type="single" value={period} onValueChange={(value) => value && setPeriod(value as Period)} className="border rounded-lg p-1 bg-muted/50">
          <ToggleGroupItem value="7" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">7 dias</ToggleGroupItem>
          <ToggleGroupItem value="30" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">30 dias</ToggleGroupItem>
          <ToggleGroupItem value="90" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">90 dias</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Receita dos Últimos {days} Dias</h2>
        <ChartContainer config={{ amount: { label: "Receita (R$)", color: "hsl(var(--primary))" } }} className="h-[280px] w-full">
          <AreaChart data={revenueByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#areaGrad)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Receitas Mais Vendidas</h2>
          <ChartContainer config={{ count: { label: "Vendas", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
            <BarChart data={popularRecipes} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="grid gap-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Métodos de Pagamento</h2>
            <div className="h-[130px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={12}>
                    {methodBreakdown.map((_, index) => (<Cell key={index} fill={pieColors[index % pieColors.length]} />))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Status dos Pagamentos</h2>
            <div className="space-y-2">
              {statusBreakdown.map((status, index) => (
                <div key={status.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                    <span className="text-muted-foreground">{status.name}</span>
                  </div>
                  <span className="font-semibold">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/receitas/nova"><Button className="gap-2"><PlusCircle className="h-4 w-4" />Criar Receita</Button></Link>
        <Link to="/admin/receitas"><Button variant="outline" className="gap-2"><List className="h-4 w-4" />Gerenciar Receitas</Button></Link>
        <Link to="/admin/pagamentos/transacoes"><Button variant="outline" className="gap-2"><DollarSign className="h-4 w-4" />Ver Transações</Button></Link>
      </div>
    </div>
  );
}
