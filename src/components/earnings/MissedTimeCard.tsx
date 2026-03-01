import { memo, useMemo } from "react";
import { AlertTriangle, CalendarX, Clock } from "lucide-react";
import { WorkSession, ScheduleEntry } from "@/types/earnings";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MissedTimeCardProps {
  sessions: WorkSession[];
  schedule: ScheduleEntry[];
}

interface MissedDay {
  date: string;
  type: "missed" | "short";
  scheduledHours: number;
  actualHours: number;
  missedHours: number;
}

export const MissedTimeCard = memo(({ sessions, schedule }: MissedTimeCardProps) => {
  const missedData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group sessions by date
    const sessionsByDate = new Map<string, number>();
    for (const s of sessions) {
      sessionsByDate.set(s.date, (sessionsByDate.get(s.date) || 0) + s.duration);
    }

    const missed: MissedDay[] = [];

    // Check last 30 days (excluding today)
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();

      const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek && s.enabled);
      if (!entry) continue; // Not a scheduled day

      const [startH, startM] = entry.startTime.split(":").map(Number);
      const [endH, endM] = entry.endTime.split(":").map(Number);
      const scheduledHours = (endH + endM / 60) - (startH + startM / 60);

      const actualSeconds = sessionsByDate.get(dateStr) || 0;
      const actualHours = actualSeconds / 3600;

      if (actualSeconds === 0) {
        missed.push({ date: dateStr, type: "missed", scheduledHours, actualHours: 0, missedHours: scheduledHours });
      } else if (actualHours < scheduledHours) {
        missed.push({
          date: dateStr,
          type: "short",
          scheduledHours,
          actualHours,
          missedHours: scheduledHours - actualHours,
        });
      }
    }

    const totalMissedDays = missed.filter((m) => m.type === "missed").length;
    const totalMissedHours = missed.reduce((sum, m) => sum + m.missedHours, 0);

    return { days: missed, totalMissedDays, totalMissedHours };
  }, [sessions, schedule]);

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h3 className="font-semibold text-foreground">Missed Time</h3>
        <span className="text-xs text-muted-foreground">(last 30 days)</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CalendarX className="w-4 h-4 text-destructive" />
            <span className="text-lg font-bold text-foreground tabular-nums">
              {missedData.totalMissedDays}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Missed Days</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-lg font-bold text-foreground tabular-nums">
              {missedData.totalMissedHours.toFixed(1)}h
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Missed Hours</p>
        </div>
      </div>

      {missedData.days.length > 0 ? (
        <ScrollArea className="h-[180px]">
          <div className="space-y-1.5">
            {missedData.days.map((day) => (
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
                <div className="flex items-center gap-2">
                  {day.type === "missed" ? (
                    <Badge variant="destructive" className="text-xs">
                      Missed ({day.scheduledHours.toFixed(1)}h)
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {day.actualHours.toFixed(1)}h / {day.scheduledHours.toFixed(1)}h
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          🎉 No missed time — great consistency!
        </p>
      )}
    </div>
  );
});

MissedTimeCard.displayName = "MissedTimeCard";
