import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRL, STATUS_LABELS, COLORS } from "./constants";
import { Landmark, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";


export interface FinancialDashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  stripeStatus?: {
    connected: boolean;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    buyerEmail: string;
    createdAt: string;
    method: string | null;
  }>;
}

type FinancialDashboardProps = {
  loading?: boolean;
  stats: FinancialDashboardStats;
};

export default function FinancialDashboard({ loading = false, stats }: FinancialDashboardProps) {
  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Carregando dados financeiros...</div>;
  }

  const isStripeActive = stats.stripeStatus?.connected && stats.stripeStatus?.chargesEnabled;
  const stripeStatusText = stats.stripeStatus?.connected 
    ? (stats.stripeStatus.chargesEnabled ? 'Ativo' : 'Pendente')
    : 'Desconectado';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais (Aprovadas)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Faturamento acumulado na plataforma</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas deste Mês</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Desempenho no mês atual</p>
          </CardContent>
        </Card>

        <Card className={cn("border-l-4 shadow-sm", isStripeActive ? "border-l-indigo-500" : "border-l-amber-500")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Stripe</CardTitle>
            <Landmark className={cn("h-4 w-4", isStripeActive ? "text-indigo-500" : "text-amber-500")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", isStripeActive ? "text-green-600" : "text-amber-600")}>
              {stripeStatusText}
            </div>
            <p className="text-xs text-muted-foreground">
              {isStripeActive ? "Sua conta está ativa e recebendo" : "Ação necessária na aba Configurações"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Últimas Vendas</CardTitle>
          <Badge variant="outline" className="font-normal">Tempo Real</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentPayments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-xs">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {p.buyerEmail}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatBRL(p.amount)}
                    </TableCell>
                    <TableCell className="capitalize text-xs">
                      {p.method === 'pix' ? 'PIX' : p.method?.replace('_', ' ') || 'Stripe'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        style={{ backgroundColor: `${COLORS[p.status]}20`, color: COLORS[p.status] }}
                        className="text-[10px] uppercase font-bold"
                      >
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
