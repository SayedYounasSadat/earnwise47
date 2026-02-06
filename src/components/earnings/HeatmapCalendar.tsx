// GitHub-style heatmap calendar showing daily productivity
import { memo, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { WorkSession } from "@/types/earnings";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapCalendarProps {
  sessions: WorkSession[];
}

const WEEKS_TO_SHOW = 16; // ~4 months
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

const getIntensityClass = (earnings: number, maxEarnings: number): string => {
  if (earnings === 0) return "bg-muted/60";
  const ratio = earnings / maxEarnings;
  if (ratio < 0.25) return "bg-primary/25";
  if (ratio < 0.5) return "bg-primary/45";
  if (ratio < 0.75) return "bg-primary/70";
  return "bg-primary";
};

export const HeatmapCalendar = memo(({ sessions }: HeatmapCalendarProps) => {
  const { grid, months, maxEarnings } = useMemo(() => {
    const today = new Date();
    const totalDays = WEEKS_TO_SHOW * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Build earnings map
    const earningsMap: Record<string, { earnings: number; hours: number; count: number }> = {};
    let max = 0;

    sessions.forEach((s) => {
      if (!earningsMap[s.date]) {
        earningsMap[s.date] = { earnings: 0, hours: 0, count: 0 };
      }
      earningsMap[s.date].earnings += s.earnings;
      earningsMap[s.date].hours += s.duration / 3600;
      earningsMap[s.date].count += 1;
      if (earningsMap[s.date].earnings > max) {
        max = earningsMap[s.date].earnings;
      }
    });

    // Build grid (columns = weeks, rows = days of week)
    const weeks: { date: string; dayOfWeek: number; earnings: number; hours: number; count: number; isToday: boolean; isFuture: boolean }[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    for (let w = 0; w < WEEKS_TO_SHOW + 1; w++) {
      const week: typeof weeks[0] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split("T")[0];
        const data = earningsMap[dateStr] || { earnings: 0, hours: 0, count: 0 };
        const curMonth = cursor.getMonth();

        if (curMonth !== lastMonth) {
          monthLabels.push({
            label: cursor.toLocaleString("default", { month: "short" }),
            col: w,
          });
          lastMonth = curMonth;
        }

        week.push({
          date: dateStr,
          dayOfWeek: d,
          ...data,
          isToday: dateStr === today.toISOString().split("T")[0],
          isFuture: cursor > today,
        });

        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return { grid: weeks, months: monthLabels, maxEarnings: max || 1 };
  }, [sessions]);

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-5">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Activity Heatmap</h3>
      </div>

      {/* Month labels */}
      <div className="flex ml-8 mb-1 text-xs text-muted-foreground">
        {months.map((m, i) => (
          <span
            key={i}
            className="absolute"
            style={{ marginLeft: `${m.col * 16}px` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5 mt-6 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {DAYS.map((label, i) => (
            <div key={i} className="h-3 w-6 text-[10px] text-muted-foreground flex items-center justify-end pr-1">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <Tooltip key={day.date} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className={`h-3 w-3 rounded-sm transition-colors ${
                      day.isFuture
                        ? "bg-transparent"
                        : day.isToday
                        ? `${getIntensityClass(day.earnings, maxEarnings)} ring-1 ring-foreground/30`
                        : getIntensityClass(day.earnings, maxEarnings)
                    }`}
                  />
                </TooltipTrigger>
                {!day.isFuture && (
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">
                      {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {day.earnings > 0 ? (
                      <>
                        <p className="text-accent">${day.earnings.toFixed(2)} earned</p>
                        <p>{day.hours.toFixed(1)}h · {day.count} session{day.count !== 1 ? "s" : ""}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No activity</p>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-muted/60" />
        <div className="h-3 w-3 rounded-sm bg-primary/25" />
        <div className="h-3 w-3 rounded-sm bg-primary/45" />
        <div className="h-3 w-3 rounded-sm bg-primary/70" />
        <div className="h-3 w-3 rounded-sm bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
});

HeatmapCalendar.displayName = "HeatmapCalendar";
