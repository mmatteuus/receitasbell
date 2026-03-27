import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { exportChartAsPNG } from "../exportChart";
import { FullscreenChart } from "@/components/FullscreenChart";

interface Props {
  data: { date: string; rate: number; total: number }[];
}

function ChartContent({ data, height = 350 }: Props & { height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
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
  );
}

export function SuccessRateChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Taxa de Sucesso por Dia</CardTitle>
          <CardDescription>Percentual de transações aprovadas em relação ao total diário</CardDescription>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => exportChartAsPNG(ref, "taxa-sucesso")} title="Exportar como PNG">
            <Camera className="h-4 w-4" />
          </Button>
          <FullscreenChart title="Taxa de Sucesso por Dia">
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
