// Earnings history chart using Recharts
import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";

interface ChartDataPoint {
  date: string;
  earnings: number;
  hours: number;
  label: string;
}

interface EarningsChartProps {
  data: ChartDataPoint[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-accent">
          ${data.earnings.toFixed(2)} earned
        </p>
        <p className="text-sm text-muted-foreground">
          {data.hours.toFixed(1)} hours worked
        </p>
      </div>
    );
  }
  return null;
};

export const EarningsChart = memo(({ data }: EarningsChartProps) => {
  const hasData = data.some((d) => d.earnings > 0);

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Last 7 Days</h3>
      </div>

      {!hasData ? (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No earnings data yet</p>
            <p className="text-sm">Work some sessions to see your chart</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
            <Bar
              dataKey="earnings"
              fill="hsl(var(--accent))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

EarningsChart.displayName = "EarningsChart";
