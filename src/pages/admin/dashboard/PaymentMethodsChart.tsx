import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/ui/chart";

type MethodPoint = {
  name: string;
  value: number;
};

type Props = {
  methodBreakdown: MethodPoint[];
  pieColors: string[];
};

export function PaymentMethodsChart({ methodBreakdown, pieColors }: Props) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={methodBreakdown}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={5}
              strokeWidth={0}
            >
              {methodBreakdown.map((_, index) => (
                <Cell key={index} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <ChartTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 w-full max-w-sm px-4">
        {methodBreakdown.map((method, index) => (
          <div key={method.name} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
            <span className="text-xs font-medium text-muted-foreground truncate">{method.name}</span>
            <span className="text-xs font-bold ml-auto">{method.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
