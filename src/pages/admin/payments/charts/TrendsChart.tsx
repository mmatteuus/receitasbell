import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatBRL } from "../constants";
import { exportChartAsPNG } from "../exportChart";
import { FullscreenChart } from "@/components/FullscreenChart";

interface Props {
  data: { date: string; revenue: number; count: number }[];
}

function ChartContent({ data, height = 350 }: Props & { height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
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
  );
}

export function TrendsChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Tendência de Receita</CardTitle>
          <CardDescription>Receita aprovada por dia no período selecionado</CardDescription>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => exportChartAsPNG(ref, "tendencia-receita")} title="Exportar como PNG">
            <Camera className="h-4 w-4" />
          </Button>
          <FullscreenChart title="Tendência de Receita">
            <ChartContent data={data} height={600} />
          </FullscreenChart>
        </div>
      </CardHeader>
      <CardContent ref={ref}>
        <ChartContent data={data} />
      </CardContent>
    </Card>
  );
}
