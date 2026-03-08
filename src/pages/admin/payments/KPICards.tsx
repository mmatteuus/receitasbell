import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CheckCircle, Clock, RotateCcw } from "lucide-react";
import { formatBRL } from "./constants";

interface Stats {
  totalRevenue: number;
  avgTicket: number;
  approvalRate: number;
  approved: number;
  total: number;
  pending: number;
  rejected: number;
  refunded: number;
}

export function KPICards({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Receita Total",
      icon: DollarSign,
      value: formatBRL(stats.totalRevenue),
      sub: `Ticket médio: ${formatBRL(stats.avgTicket)}`,
    },
    {
      title: "Taxa de Aprovação",
      icon: CheckCircle,
      value: `${stats.approvalRate.toFixed(1)}%`,
      sub: `${stats.approved} de ${stats.total} transações`,
    },
    {
      title: "Pendentes",
      icon: Clock,
      value: String(stats.pending),
      sub: `Rejeitados: ${stats.rejected}`,
    },
    {
      title: "Reembolsos",
      icon: RotateCcw,
      value: String(stats.refunded),
      sub: `Total: ${stats.total} transações`,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{c.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
