import { memo, useMemo } from "react";
import { WorkSession } from "@/types/earnings";
import { Flame, Trophy, Clock, DollarSign, Calendar, Star, Zap, Award, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StreakAchievementsProps {
  sessions: WorkSession[];
  schedule?: import("@/types/earnings").ScheduleEntry[];
}

interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number; // 0-100
  category: "earnings" | "time" | "streak" | "sessions";
}

const getUniqueWorkDays = (sessions: WorkSession[]): string[] => {
  return [...new Set(sessions.map(s => s.date))].sort();
};

const isDayOff = (dateStr: string, schedule?: import("@/types/earnings").ScheduleEntry[]): boolean => {
  if (!schedule || schedule.length === 0) return false;
  const d = new Date(dateStr + "T00:00:00");
  const dayOfWeek = d.getDay();
  const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek);
  return !entry || !entry.enabled;
};

const isGapAllOffDays = (from: string, to: string, schedule?: import("@/types/earnings").ScheduleEntry[]): boolean => {
  if (!schedule || schedule.length === 0) return false;
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  // Check each day in between (exclusive of from and to)
  const d = new Date(start);
  d.setDate(d.getDate() + 1);
  while (d < end) {
    const dateStr = d.toISOString().split("T")[0];
    if (!isDayOff(dateStr, schedule)) return false;
    d.setDate(d.getDate() + 1);
  }
  return true;
};

const calculateStreak = (sessions: WorkSession[], schedule?: import("@/types/earnings").ScheduleEntry[]): { current: number; best: number } => {
  const days = getUniqueWorkDays(sessions);
  if (days.length === 0) return { current: 0, best: 0 };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let best = 0;
  let streak = 1;

  // Check if the streak is still active (worked today, or yesterday, or last work day with off days in between)
  const lastDay = days[days.length - 1];
  let streakActive = lastDay === today || lastDay === yesterday;
  if (!streakActive && lastDay < today) {
    streakActive = isGapAllOffDays(lastDay, today, schedule);
  }

  // Calculate best streak (schedule-aware)
  for (let i = days.length - 1; i > 0; i--) {
    const curr = days[i];
    const prev = days[i - 1];
    const diffDays = (new Date(curr).getTime() - new Date(prev).getTime()) / 86400000;

    if (diffDays === 1 || isGapAllOffDays(prev, curr, schedule)) {
      streak++;
    } else {
      best = Math.max(best, streak);
      streak = 1;
    }
  }
  best = Math.max(best, streak);

  // Current streak: count backwards from most recent day
  let current = 0;
  if (streakActive) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      const curr = days[i];
      const prev = days[i - 1];
      const diffDays = (new Date(curr).getTime() - new Date(prev).getTime()) / 86400000;
      if (diffDays === 1 || isGapAllOffDays(prev, curr, schedule)) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, best };
};

export const StreakAchievements = memo(({ sessions, schedule }: StreakAchievementsProps) => {
  const stats = useMemo(() => {
    const totalEarnings = sessions.reduce((sum, s) => sum + s.earnings, 0);
    const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 3600;
    const totalSessions = sessions.length;
    const streak = calculateStreak(sessions, schedule);
    const uniqueDays = getUniqueWorkDays(sessions).length;
    return { totalEarnings, totalHours, totalSessions, streak, uniqueDays };
  }, [sessions, schedule]);

  const achievements: Achievement[] = useMemo(() => [
    // Earnings milestones
    {
      id: "first-dollar",
      icon: <DollarSign className="w-5 h-5" />,
      title: "First Dollar",
      description: "Earn your first $1",
      unlocked: stats.totalEarnings >= 1,
      progress: Math.min((stats.totalEarnings / 1) * 100, 100),
      category: "earnings",
    },
    {
      id: "hundred-club",
      icon: <DollarSign className="w-5 h-5" />,
      title: "Hundred Club",
      description: "Earn $100 total",
      unlocked: stats.totalEarnings >= 100,
      progress: Math.min((stats.totalEarnings / 100) * 100, 100),
      category: "earnings",
    },
    {
      id: "five-hundred",
      icon: <Trophy className="w-5 h-5" />,
      title: "High Roller",
      description: "Earn $500 total",
      unlocked: stats.totalEarnings >= 500,
      progress: Math.min((stats.totalEarnings / 500) * 100, 100),
      category: "earnings",
    },
    {
      id: "thousand",
      icon: <Star className="w-5 h-5" />,
      title: "Grand Master",
      description: "Earn $1,000 total",
      unlocked: stats.totalEarnings >= 1000,
      progress: Math.min((stats.totalEarnings / 1000) * 100, 100),
      category: "earnings",
    },
    // Time milestones
    {
      id: "ten-hours",
      icon: <Clock className="w-5 h-5" />,
      title: "Getting Started",
      description: "Work 10 hours total",
      unlocked: stats.totalHours >= 10,
      progress: Math.min((stats.totalHours / 10) * 100, 100),
      category: "time",
    },
    {
      id: "fifty-hours",
      icon: <Clock className="w-5 h-5" />,
      title: "Dedicated Worker",
      description: "Work 50 hours total",
      unlocked: stats.totalHours >= 50,
      progress: Math.min((stats.totalHours / 50) * 100, 100),
      category: "time",
    },
    {
      id: "hundred-hours",
      icon: <Award className="w-5 h-5" />,
      title: "Century Club",
      description: "Work 100 hours total",
      unlocked: stats.totalHours >= 100,
      progress: Math.min((stats.totalHours / 100) * 100, 100),
      category: "time",
    },
    // Streak milestones
    {
      id: "streak-3",
      icon: <Flame className="w-5 h-5" />,
      title: "On Fire",
      description: "3-day work streak",
      unlocked: stats.streak.best >= 3,
      progress: Math.min((stats.streak.best / 3) * 100, 100),
      category: "streak",
    },
    {
      id: "streak-7",
      icon: <Flame className="w-5 h-5" />,
      title: "Week Warrior",
      description: "7-day work streak",
      unlocked: stats.streak.best >= 7,
      progress: Math.min((stats.streak.best / 7) * 100, 100),
      category: "streak",
    },
    {
      id: "streak-30",
      icon: <Zap className="w-5 h-5" />,
      title: "Unstoppable",
      description: "30-day work streak",
      unlocked: stats.streak.best >= 30,
      progress: Math.min((stats.streak.best / 30) * 100, 100),
      category: "streak",
    },
    // Session milestones
    {
      id: "ten-sessions",
      icon: <Target className="w-5 h-5" />,
      title: "Regular",
      description: "Complete 10 sessions",
      unlocked: stats.totalSessions >= 10,
      progress: Math.min((stats.totalSessions / 10) * 100, 100),
      category: "sessions",
    },
    {
      id: "fifty-sessions",
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Consistent",
      description: "Complete 50 sessions",
      unlocked: stats.totalSessions >= 50,
      progress: Math.min((stats.totalSessions / 50) * 100, 100),
      category: "sessions",
    },
  ], [stats]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Streak Display */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            "p-3 rounded-xl",
            stats.streak.current > 0 ? "bg-destructive/10" : "bg-muted"
          )}>
            <Flame className={cn(
              "w-6 h-6",
              stats.streak.current > 0 ? "text-destructive" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Work Streak</h3>
            <p className="text-sm text-muted-foreground">Keep the momentum going!</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {stats.streak.current > 0 && <span className="text-2xl">🔥</span>}
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {stats.streak.current}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.streak.current === 0 ? "Start working today!" : 
               stats.streak.current === 1 ? "day" : "days"}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {stats.streak.best >= 3 && <span className="text-2xl">⚡</span>}
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {stats.streak.best}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Best Streak</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.streak.best === 0 ? "No streak yet" :
               stats.streak.best === 1 ? "day" : "days"}
            </p>
          </div>
        </div>

        {/* Fire emoji row based on streak length */}
        {stats.streak.current > 0 && (
          <div className="mt-4 flex items-center justify-center gap-1 text-2xl">
            {Array.from({ length: Math.min(stats.streak.current, 10) }).map((_, i) => (
              <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                🔥
              </span>
            ))}
            {stats.streak.current > 10 && (
              <span className="text-sm text-muted-foreground ml-1">+{stats.streak.current - 10}</span>
            )}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/10">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Achievements</h3>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} of {achievements.length} unlocked
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {Math.round((unlockedCount / achievements.length) * 100)}%
          </Badge>
        </div>

        {/* Achievement progress bar */}
        <div className="h-2 rounded-full bg-muted mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                achievement.unlocked
                  ? "bg-accent/5 border-accent/20"
                  : "bg-muted/30 border-border/50 opacity-60"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                achievement.unlocked ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
              )}>
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-semibold text-sm truncate",
                    achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {achievement.title}
                  </span>
                  {achievement.unlocked && <span className="text-sm">✅</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                {!achievement.unlocked && (
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent/50 transition-all"
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

StreakAchievements.displayName = "StreakAchievements";
