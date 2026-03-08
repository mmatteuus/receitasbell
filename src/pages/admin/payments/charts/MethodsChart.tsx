import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { formatBRL, METHOD_COLORS, COLORS } from "../constants";
import { exportChartAsPNG } from "../exportChart";

interface MethodData {
  method: string;
  label: string;
  revenue: number;
  count: number;
}

interface StatusData {
  name: string;
  statusKey: string;
  value: number;
  color: string;
}

interface Props {
  revenueByMethod: MethodData[];
  statusDistribution: StatusData[];
  onMethodClick: (data: any) => void;
  onStatusClick: (data: any) => void;
}

export function MethodsChart({ revenueByMethod, statusDistribution, onMethodClick, onStatusClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2" ref={ref}>
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Receita por Método</CardTitle>
          <CardDescription>Clique em uma fatia para filtrar transações</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueByMethod}
                dataKey="revenue"
                nameKey="label"
                cx="50%" cy="50%" outerRadius={100}
                label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                onClick={onMethodClick}
                className="cursor-pointer"
              >
                {revenueByMethod.map((entry) => (
                  <Cell key={entry.method} fill={METHOD_COLORS[entry.method] || 'hsl(0,0%,60%)'} />
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
              <Bar dataKey="count" name="Transações" radius={[4, 4, 0, 0]} onClick={onMethodClick} className="cursor-pointer">
                {revenueByMethod.map((entry) => (
                  <Cell key={entry.method} fill={METHOD_COLORS[entry.method] || 'hsl(0,0%,60%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Distribuição de Status</CardTitle>
            <CardDescription>Clique em uma barra para filtrar transações por status</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => exportChartAsPNG(ref, "metodos-pagamento")} title="Exportar como PNG">
            <Camera className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="value" name="Transações" radius={[0, 4, 4, 0]} onClick={onStatusClick} className="cursor-pointer">
                {statusDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
