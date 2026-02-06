// Week-over-week and month-over-month comparison charts
import { memo, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkSession } from "@/types/earnings";

interface ComparisonChartsProps {
  sessions: WorkSession[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: ${p.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChangeIndicator = ({ current, previous }: { current: number; previous: number }) => {
  if (previous === 0 && current === 0) {
    return <span className="text-sm text-muted-foreground flex items-center gap-1"><Minus className="w-3.5 h-3.5" /> No data</span>;
  }
  if (previous === 0) {
    return <span className="text-sm text-success flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> New</span>;
  }
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 1) {
    return <span className="text-sm text-muted-foreground flex items-center gap-1"><Minus className="w-3.5 h-3.5" /> Same</span>;
  }
  return change > 0 ? (
    <span className="text-sm text-success flex items-center gap-1">
      <TrendingUp className="w-3.5 h-3.5" /> +{change.toFixed(1)}%
    </span>
  ) : (
    <span className="text-sm text-destructive flex items-center gap-1">
      <TrendingDown className="w-3.5 h-3.5" /> {change.toFixed(1)}%
    </span>
  );
};

export const ComparisonCharts = memo(({ sessions }: ComparisonChartsProps) => {
  const [tab, setTab] = useState("weekly");

  const weekComparison = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Current week start (Sunday)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - dayOfWeek);

    // Last week start
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const data = dayNames.map((name, i) => {
      const thisDay = new Date(thisWeekStart);
      thisDay.setDate(thisDay.getDate() + i);
      const thisDayStr = thisDay.toISOString().split("T")[0];

      const lastDay = new Date(lastWeekStart);
      lastDay.setDate(lastDay.getDate() + i);
      const lastDayStr = lastDay.toISOString().split("T")[0];

      const thisEarnings = sessions
        .filter((s) => s.date === thisDayStr)
        .reduce((sum, s) => sum + s.earnings, 0);

      const lastEarnings = sessions
        .filter((s) => s.date === lastDayStr)
        .reduce((sum, s) => sum + s.earnings, 0);

      return { name, "This Week": thisEarnings, "Last Week": lastEarnings };
    });

    const thisTotal = data.reduce((s, d) => s + d["This Week"], 0);
    const lastTotal = data.reduce((s, d) => s + d["Last Week"], 0);

    return { data, thisTotal, lastTotal };
  }, [sessions]);

  const monthComparison = useMemo(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Split into ~4 week buckets
    const buckets = ["Week 1", "Week 2", "Week 3", "Week 4"];
    const data = buckets.map((name, i) => {
      const startDay = i * 7 + 1;
      const endDay = i === 3 ? 31 : (i + 1) * 7;

      const thisStart = `${thisYear}-${String(thisMonth + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
      const thisEnd = `${thisYear}-${String(thisMonth + 1).padStart(2, "0")}-${String(Math.min(endDay, new Date(thisYear, thisMonth + 1, 0).getDate())).padStart(2, "0")}`;

      const lastStart = `${lastYear}-${String(lastMonth + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
      const lastEnd = `${lastYear}-${String(lastMonth + 1).padStart(2, "0")}-${String(Math.min(endDay, new Date(lastYear, lastMonth + 1, 0).getDate())).padStart(2, "0")}`;

      const thisEarnings = sessions
        .filter((s) => s.date >= thisStart && s.date <= thisEnd)
        .reduce((sum, s) => sum + s.earnings, 0);

      const lastEarnings = sessions
        .filter((s) => s.date >= lastStart && s.date <= lastEnd)
        .reduce((sum, s) => sum + s.earnings, 0);

      return { name, "This Month": thisEarnings, "Last Month": lastEarnings };
    });

    const thisTotal = data.reduce((s, d) => s + d["This Month"], 0);
    const lastTotal = data.reduce((s, d) => s + d["Last Month"], 0);

    return { data, thisTotal, lastTotal };
  }, [sessions]);

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-5">
        <ArrowUpDown className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Comparisons</h3>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="weekly">Week vs Week</TabsTrigger>
          <TabsTrigger value="monthly">Month vs Month</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          {/* Summary */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">This week</p>
              <p className="font-bold text-foreground">${weekComparison.thisTotal.toFixed(2)}</p>
            </div>
            <ChangeIndicator current={weekComparison.thisTotal} previous={weekComparison.lastTotal} />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Last week</p>
              <p className="font-bold text-muted-foreground">${weekComparison.lastTotal.toFixed(2)}</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekComparison.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="This Week" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Last Week" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">This month</p>
              <p className="font-bold text-foreground">${monthComparison.thisTotal.toFixed(2)}</p>
            </div>
            <ChangeIndicator current={monthComparison.thisTotal} previous={monthComparison.lastTotal} />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Last month</p>
              <p className="font-bold text-muted-foreground">${monthComparison.lastTotal.toFixed(2)}</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthComparison.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="This Month" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Last Month" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
});

ComparisonCharts.displayName = "ComparisonCharts";
