import { memo, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { BudgetExpense, BudgetIncome, WorkSession } from "@/types/earnings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthlyTrendsChartProps {
  expenses: BudgetExpense[];
  incomes: BudgetIncome[];
  sessions?: WorkSession[];
}

interface MonthBucket {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

type RangeOption = 3 | 6 | 12;
const RANGE_OPTIONS: RangeOption[] = [3, 6, 12];

export const MonthlyTrendsChart = memo(
  ({ expenses, incomes, sessions = [] }: MonthlyTrendsChartProps) => {
    const [range, setRange] = useState<RangeOption>(6);

    const data = useMemo<MonthBucket[]>(() => {
      const months: MonthBucket[] = [];
      const now = new Date();
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label =
          range === 12
            ? d.toLocaleDateString(undefined, { month: "short", year: "2-digit" })
            : d.toLocaleDateString(undefined, { month: "short" });
        months.push({ key, label, income: 0, expenses: 0, net: 0 });
      }
      const map = new Map(months.map((m) => [m.key, m]));

      for (const e of expenses) {
        const k = e.date.slice(0, 7);
        const m = map.get(k);
        if (m) m.expenses += e.amount;
      }
      for (const i of incomes) {
        const k = i.date.slice(0, 7);
        const m = map.get(k);
        if (m) m.income += i.amount;
      }
      for (const s of sessions) {
        if (!s.earnings || s.earnings <= 0) continue;
        const k = s.date.slice(0, 7);
        const m = map.get(k);
        if (m) m.income += s.earnings;
      }
      months.forEach((m) => {
        m.net = m.income - m.expenses;
      });
      return months;
    }, [expenses, incomes, sessions]);

    const hasData = data.some((d) => d.income > 0 || d.expenses > 0);

    return (
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          6-Month Trends
        </h4>
        {!hasData ? (
          <p className="text-xs text-muted-foreground py-8 text-center">
            No data yet. Add expenses or income to see trends.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Net Flow"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }
);
MonthlyTrendsChart.displayName = "MonthlyTrendsChart";
