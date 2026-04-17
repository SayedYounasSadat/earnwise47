import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from "@/types/earnings";

interface CategoryData {
  category: ExpenseCategory;
  amount: number;
  pct: number;
}

interface Props {
  data: CategoryData[];
  total: number;
}

// Use HSL design tokens — cycle through chart colors
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--chart-2, 200 70% 50%))",
  "hsl(var(--chart-3, 280 65% 55%))",
  "hsl(var(--chart-4, 30 80% 55%))",
  "hsl(var(--chart-5, 340 70% 55%))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--secondary-foreground))",
  "hsl(var(--ring))",
];

export const CategoryPieChart = memo(({ data, total }: Props) => {
  if (data.length === 0 || total === 0) {
    return (
      <div className="glass-card rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground py-8">
          Add expenses to see your spending breakdown.
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: EXPENSE_CATEGORY_LABELS[d.category],
    value: d.amount,
    pct: d.pct,
  }));

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h4 className="font-semibold text-foreground text-sm">Spending Breakdown</h4>
      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <div className="h-[200px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="font-bold text-foreground tabular-nums">${total.toFixed(0)}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {chartData.slice(0, 6).map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate flex-1">{d.name}</span>
              <span className="font-medium text-foreground tabular-nums">
                {d.pct.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
CategoryPieChart.displayName = "CategoryPieChart";
