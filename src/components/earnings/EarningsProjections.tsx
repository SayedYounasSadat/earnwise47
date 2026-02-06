// Earnings projections based on current pace
import { memo, useMemo } from "react";
import { TrendingUp, Zap, CalendarDays, Target } from "lucide-react";
import { WorkSession } from "@/types/earnings";

interface EarningsProjectionsProps {
  sessions: WorkSession[];
  todayEarnings: number;
  todayGoal: number;
}

export const EarningsProjections = memo(
  ({ sessions, todayEarnings, todayGoal }: EarningsProjectionsProps) => {
    const projections = useMemo(() => {
      const today = new Date();
      const dayOfMonth = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const remainingDays = daysInMonth - dayOfMonth;

      // Calculate averages from last 30 days
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      const recentSessions = sessions.filter((s) => s.date >= thirtyDaysAgoStr);
      const recentDays = new Set(recentSessions.map((s) => s.date));
      const activeDays = recentDays.size || 1;

      const totalRecentEarnings = recentSessions.reduce((sum, s) => sum + s.earnings, 0);
      const avgDailyEarnings = totalRecentEarnings / activeDays;
      const totalRecentHours = recentSessions.reduce((sum, s) => sum + s.duration, 0) / 3600;
      const avgDailyHours = totalRecentHours / activeDays;

      // This month's actual earnings so far
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      const thisMonthSessions = sessions.filter((s) => s.date >= monthStart);
      const earnedThisMonth = thisMonthSessions.reduce((sum, s) => sum + s.earnings, 0);

      // Projections
      const projectedMonthly = earnedThisMonth + avgDailyEarnings * remainingDays;
      const projectedWeekly = avgDailyEarnings * 7;
      const daysWorkedPerWeek = Math.min(activeDays / (30 / 7), 7);

      // Goal pace
      const onPaceForGoal = todayEarnings >= (todayGoal * (new Date().getHours() / 24));
      const timeToGoal =
        todayEarnings >= todayGoal
          ? 0
          : avgDailyHours > 0
          ? ((todayGoal - todayEarnings) / (totalRecentEarnings / totalRecentHours || 1))
          : 0;

      return {
        avgDailyEarnings,
        avgDailyHours,
        projectedMonthly,
        projectedWeekly,
        earnedThisMonth,
        remainingDays,
        daysWorkedPerWeek,
        onPaceForGoal,
        timeToGoal,
        activeDays,
        hasData: recentSessions.length > 0,
      };
    }, [sessions, todayEarnings, todayGoal]);

    if (!projections.hasData) {
      return (
        <div className="glass-card rounded-xl p-6 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Earnings Projections</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Start working sessions to see your earnings projections here.
          </p>
        </div>
      );
    }

    return (
      <div className="glass-card rounded-xl p-6 card-hover">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Earnings Projections</h3>
        </div>

        <div className="space-y-4">
          {/* Monthly projection */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Monthly Projection</span>
            </div>
            <p className="text-2xl font-bold earnings-number">
              ${projections.projectedMonthly.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ${projections.earnedThisMonth.toFixed(2)} earned + ${(projections.avgDailyEarnings * projections.remainingDays).toFixed(2)} projected ({projections.remainingDays} days left)
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Avg. Daily</span>
              </div>
              <p className="font-bold text-foreground">${projections.avgDailyEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{projections.avgDailyHours.toFixed(1)}h/day</p>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Weekly Est.</span>
              </div>
              <p className="font-bold text-foreground">${projections.projectedWeekly.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">~{projections.daysWorkedPerWeek.toFixed(1)} days/week</p>
            </div>
          </div>

          {/* Goal pace indicator */}
          <div className={`p-3 rounded-lg flex items-center gap-3 ${projections.onPaceForGoal ? "bg-success/10 border border-success/20" : "bg-warning/10 border border-warning/20"}`}>
            <Target className={`w-5 h-5 shrink-0 ${projections.onPaceForGoal ? "text-success" : "text-warning"}`} />
            <div>
              <p className={`text-sm font-medium ${projections.onPaceForGoal ? "text-success" : "text-warning"}`}>
                {projections.onPaceForGoal ? "On pace for today's goal!" : "Behind on today's goal"}
              </p>
              {projections.timeToGoal > 0 && (
                <p className="text-xs text-muted-foreground">
                  ~{projections.timeToGoal.toFixed(1)}h more needed to reach ${todayGoal.toFixed(0)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EarningsProjections.displayName = "EarningsProjections";
