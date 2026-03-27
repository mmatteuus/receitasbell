import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatBRL } from "../constants";
import { exportChartAsPNG } from "../exportChart";
import { FullscreenChart } from "@/components/FullscreenChart";

interface MonthData {
  month: string;
  label: string;
  revenue: number;
  count: number;
  approved: number;
  avgTicket: number;
}

interface Props {
  data: MonthData[];
}

function VariationBadge({ label, current, previous }: { label: string; current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
  const isPositive = pct > 0;
  const isNeutral = pct === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isNeutral
    ? "text-muted-foreground"
    : isPositive
      ? "text-emerald-600"
      : "text-red-500";

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className={`font-semibold ${color}`}>
        {isNeutral ? "0%" : `${isPositive ? "+" : ""}${pct.toFixed(1)}%`}
      </span>
    </div>
  );
}

function ChartContent({ data, height = 400 }: { data: MonthData[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" />
        <YAxis yAxisId="left" tickFormatter={(val) => formatBRL(val)} width={90} />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(val: number, name: string) => {
            if (name === 'revenue') return [formatBRL(val), 'Receita'];
            if (name === 'avgTicket') return [formatBRL(val), 'Ticket Médio'];
            return [val, 'Transações'];
          }}
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
        />
        <Legend formatter={(value) => {
          if (value === 'revenue') return 'Receita';
          if (value === 'count') return 'Total Transações';
          if (value === 'avgTicket') return 'Ticket Médio';
          return value;
        }} />
        <Bar yAxisId="left" dataKey="revenue" name="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="count" name="count" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
        <Line yAxisId="left" type="monotone" dataKey="avgTicket" name="avgTicket" stroke="hsl(45, 93%, 47%)" strokeWidth={2} dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function MonthlyChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const current = data.length >= 1 ? data[data.length - 1] : null;
  const previous = data.length >= 2 ? data[data.length - 2] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Comparação Mês a Mês</CardTitle>
          <CardDescription>Evolução da receita e volume de transações por mês</CardDescription>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => exportChartAsPNG(ref, "comparacao-mensal")} aria-label="Exportar gráfico como PNG">
            <Camera className="h-4 w-4" />
          </Button>
          <FullscreenChart title="Comparação Mês a Mês">
            <ChartContent data={data} height={600} />
          </FullscreenChart>
        </div>
      </CardHeader>

      {current && previous && (
        <div className="px-6 pb-2">
          <div className="rounded-lg border bg-muted/30 p-3 flex flex-wrap gap-x-6 gap-y-2">
            <span className="text-sm font-medium text-foreground w-full mb-1">
              {previous.label} → {current.label}
            </span>
            <VariationBadge label="Receita" current={current.revenue} previous={previous.revenue} />
            <VariationBadge label="Transações" current={current.count} previous={previous.count} />
            <VariationBadge label="Ticket Médio" current={current.avgTicket} previous={previous.avgTicket} />
            <VariationBadge label="Aprovadas" current={current.approved} previous={previous.approved} />
          </div>
        </div>
      )}

      <CardContent ref={ref}>
        <ChartContent data={data} />
      </CardContent>
    </Card>
  );
}
