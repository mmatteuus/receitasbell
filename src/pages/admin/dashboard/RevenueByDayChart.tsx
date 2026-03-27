import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type RevenuePoint = {
  date: string;
  amount: number;
};

type Props = {
  data: RevenuePoint[];
};

export function RevenueByDayChart({ data }: Props) {
  return (
    <ChartContainer
      config={{ amount: { label: "Receita (R$)", color: "hsl(var(--primary))" } }}
      className="h-[320px] w-full"
    >
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11 }}
          dy={10}
          className="text-muted-foreground"
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="hsl(var(--primary))"
          fill="url(#areaGrad)"
          strokeWidth={3}
          dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
