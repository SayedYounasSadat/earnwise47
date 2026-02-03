// Enhanced earnings analytics with multiple time periods
import { memo, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { BarChart3, TrendingUp, Calendar, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkSession } from "@/types/earnings";

interface ChartDataPoint {
  date: string;
  earnings: number;
  hours: number;
  label: string;
  fullLabel?: string;
  sessions?: number;
}

interface EarningsChartProps {
  sessions: WorkSession[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{data.fullLabel || label}</p>
        <p className="text-sm text-accent">
          ${data.earnings.toFixed(2)} earned
        </p>
        <p className="text-sm text-muted-foreground">
          {data.hours.toFixed(1)} hours worked
        </p>
        {data.sessions !== undefined && (
          <p className="text-sm text-muted-foreground">
            {data.sessions} sessions
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Helper functions
const getDateRange = (days: number) => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const getMonthName = (month: number): string => {
  return new Date(2000, month, 1).toLocaleString("default", { month: "short" });
};

// Generate data for different periods
const generateDailyData = (sessions: WorkSession[], days: number): ChartDataPoint[] => {
  const dates = getDateRange(days);
  return dates.map((dateStr) => {
    const daySessions = sessions.filter((s) => s.date === dateStr);
    const date = new Date(dateStr);
    return {
      date: dateStr,
      earnings: daySessions.reduce((sum, s) => sum + s.earnings, 0),
      hours: daySessions.reduce((sum, s) => sum + s.duration, 0) / 3600,
      sessions: daySessions.length,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      fullLabel: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    };
  });
};

const generateWeeklyData = (sessions: WorkSession[], weeks: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];
    
    const weekSessions = sessions.filter((s) => s.date >= weekStartStr && s.date <= weekEndStr);
    
    data.push({
      date: weekStartStr,
      earnings: weekSessions.reduce((sum, s) => sum + s.earnings, 0),
      hours: weekSessions.reduce((sum, s) => sum + s.duration, 0) / 3600,
      sessions: weekSessions.length,
      label: `W${getWeekNumber(weekStart)}`,
      fullLabel: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
  }
  
  return data;
};

const generateMonthlyData = (sessions: WorkSession[], months: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStart = monthDate.toISOString().split("T")[0];
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const monthEnd = nextMonth.toISOString().split("T")[0];
    
    const monthSessions = sessions.filter((s) => s.date >= monthStart && s.date <= monthEnd);
    
    data.push({
      date: monthStart,
      earnings: monthSessions.reduce((sum, s) => sum + s.earnings, 0),
      hours: monthSessions.reduce((sum, s) => sum + s.duration, 0) / 3600,
      sessions: monthSessions.length,
      label: getMonthName(monthDate.getMonth()),
      fullLabel: monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }
  
  return data;
};

const generateYearlyData = (sessions: WorkSession[]): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  const years = 3; // Last 3 years
  
  for (let i = years - 1; i >= 0; i--) {
    const year = today.getFullYear() - i;
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    
    const yearSessions = sessions.filter((s) => s.date >= yearStart && s.date <= yearEnd);
    
    data.push({
      date: yearStart,
      earnings: yearSessions.reduce((sum, s) => sum + s.earnings, 0),
      hours: yearSessions.reduce((sum, s) => sum + s.duration, 0) / 3600,
      sessions: yearSessions.length,
      label: year.toString(),
      fullLabel: year.toString(),
    });
  }
  
  return data;
};

// Stats summary component
const StatsSummary = memo(({ data, period }: { data: ChartDataPoint[]; period: string }) => {
  const totalEarnings = data.reduce((sum, d) => sum + d.earnings, 0);
  const totalHours = data.reduce((sum, d) => sum + d.hours, 0);
  const avgEarnings = totalEarnings / data.length;
  const avgHours = totalHours / data.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="p-4 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Earnings</p>
        <p className="text-xl font-bold text-accent">${totalEarnings.toFixed(2)}</p>
      </div>
      <div className="p-4 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Hours</p>
        <p className="text-xl font-bold text-foreground">{totalHours.toFixed(1)}h</p>
      </div>
      <div className="p-4 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg per {period}</p>
        <p className="text-xl font-bold text-primary">${avgEarnings.toFixed(2)}</p>
      </div>
      <div className="p-4 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Hours</p>
        <p className="text-xl font-bold text-foreground">{avgHours.toFixed(1)}h</p>
      </div>
    </div>
  );
});

StatsSummary.displayName = "StatsSummary";

// Chart component for each period
const PeriodChart = memo(({ data, hasData }: { data: ChartDataPoint[]; hasData: boolean }) => {
  if (!hasData) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No earnings data for this period</p>
          <p className="text-sm">Work some sessions to see your chart</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
        <Area
          type="monotone"
          dataKey="earnings"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          fill="url(#colorEarnings)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

PeriodChart.displayName = "PeriodChart";

export const EarningsChart = memo(({ sessions }: EarningsChartProps) => {
  const [activeTab, setActiveTab] = useState("week");

  // Generate data for each period
  const weekData = generateDailyData(sessions, 7);
  const biweeklyData = generateDailyData(sessions, 14);
  const monthData = generateDailyData(sessions, 30);
  const weeklyData = generateWeeklyData(sessions, 8);
  const monthlyData = generateMonthlyData(sessions, 12);
  const yearlyData = generateYearlyData(sessions);

  const hasWeekData = weekData.some((d) => d.earnings > 0);
  const hasBiweeklyData = biweeklyData.some((d) => d.earnings > 0);
  const hasMonthData = monthData.some((d) => d.earnings > 0);
  const hasWeeklyData = weeklyData.some((d) => d.earnings > 0);
  const hasMonthlyData = monthlyData.some((d) => d.earnings > 0);
  const hasYearlyData = yearlyData.some((d) => d.earnings > 0);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Earnings Analytics</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6">
          <TabsTrigger value="week">7 Days</TabsTrigger>
          <TabsTrigger value="biweekly">14 Days</TabsTrigger>
          <TabsTrigger value="month">30 Days</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="week">
          <StatsSummary data={weekData} period="day" />
          <PeriodChart data={weekData} hasData={hasWeekData} />
        </TabsContent>

        <TabsContent value="biweekly">
          <StatsSummary data={biweeklyData} period="day" />
          <PeriodChart data={biweeklyData} hasData={hasBiweeklyData} />
        </TabsContent>

        <TabsContent value="month">
          <StatsSummary data={monthData} period="day" />
          <PeriodChart data={monthData} hasData={hasMonthData} />
        </TabsContent>

        <TabsContent value="weekly">
          <StatsSummary data={weeklyData} period="week" />
          <PeriodChart data={weeklyData} hasData={hasWeeklyData} />
        </TabsContent>

        <TabsContent value="monthly">
          <StatsSummary data={monthlyData} period="month" />
          <PeriodChart data={monthlyData} hasData={hasMonthlyData} />
        </TabsContent>

        <TabsContent value="yearly">
          <StatsSummary data={yearlyData} period="year" />
          <PeriodChart data={yearlyData} hasData={hasYearlyData} />
        </TabsContent>
      </Tabs>
    </div>
  );
});

EarningsChart.displayName = "EarningsChart";
