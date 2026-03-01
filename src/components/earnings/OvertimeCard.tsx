import { memo, useMemo } from "react";
import { Clock, TrendingUp, DollarSign } from "lucide-react";
import { WorkSession, ScheduleEntry, Settings } from "@/types/earnings";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OvertimeCardProps {
  sessions: WorkSession[];
  schedule: ScheduleEntry[];
  settings: Settings;
}

const getScheduledHours = (schedule: ScheduleEntry[], dayOfWeek: number): number => {
  const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek && s.enabled);
  if (!entry) return 0;
  const [startH, startM] = entry.startTime.split(":").map(Number);
  const [endH, endM] = entry.endTime.split(":").map(Number);
  return (endH + endM / 60) - (startH + startM / 60);
};

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split("T")[0];
};

const getMonthStart = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
};

export const OvertimeCard = memo(({ sessions, schedule, settings }: OvertimeCardProps) => {
  const overtimeData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = getWeekStart();
    const monthStart = getMonthStart();

    // Group sessions by date
    const sessionsByDate = new Map<string, number>();
    for (const s of sessions) {
      sessionsByDate.set(s.date, (sessionsByDate.get(s.date) || 0) + s.duration);
    }

    let todayOvertime = 0;
    let weekOvertime = 0;
    let monthOvertime = 0;
    const dailyBreakdown: { date: string; actual: number; scheduled: number; overtime: number }[] = [];

    for (const [date, totalSeconds] of sessionsByDate) {
      const d = new Date(date + "T00:00:00");
      const dayOfWeek = d.getDay();
      const scheduledHours = getScheduledHours(schedule, dayOfWeek);
      if (scheduledHours === 0) continue; // No schedule = can't calculate overtime

      const actualHours = totalSeconds / 3600;
      const overtime = Math.max(0, actualHours - scheduledHours);

      if (overtime > 0) {
        dailyBreakdown.push({ date, actual: actualHours, scheduled: scheduledHours, overtime });

        if (date === today) todayOvertime = overtime;
        if (date >= weekStart) weekOvertime += overtime;
        if (date >= monthStart) monthOvertime += overtime;
      }
    }

    dailyBreakdown.sort((a, b) => b.date.localeCompare(a.date));

    return {
      today: todayOvertime,
      week: weekOvertime,
      month: monthOvertime,
      breakdown: dailyBreakdown.slice(0, 14), // last 14 entries
    };
  }, [sessions, schedule]);

  const overtimeEarnings = overtimeData.month * settings.hourlyRate * settings.overtimeMultiplier;

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Overtime</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {settings.overtimeMultiplier}x rate
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground tabular-nums">
            {overtimeData.today.toFixed(1)}h
          </p>
          <p className="text-xs text-muted-foreground">Today</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground tabular-nums">
            {overtimeData.week.toFixed(1)}h
          </p>
          <p className="text-xs text-muted-foreground">This Week</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground tabular-nums">
            {overtimeData.month.toFixed(1)}h
          </p>
          <p className="text-xs text-muted-foreground">This Month</p>
        </div>
      </div>

      {overtimeEarnings > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20 mb-4">
          <DollarSign className="w-4 h-4 text-accent" />
          <span className="text-sm text-foreground">
            Est. overtime earnings this month:{" "}
            <span className="font-bold text-accent">${overtimeEarnings.toFixed(2)}</span>
          </span>
        </div>
      )}

      {overtimeData.breakdown.length > 0 ? (
        <ScrollArea className="h-[150px]">
          <div className="space-y-1.5">
            {overtimeData.breakdown.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30"
              >
                <span className="text-muted-foreground">
                  {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {day.actual.toFixed(1)}h / {day.scheduled.toFixed(1)}h
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    +{day.overtime.toFixed(1)}h
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No overtime recorded yet
        </p>
      )}
    </div>
  );
});

OvertimeCard.displayName = "OvertimeCard";
