// Study analytics: today / week / streak + 7-day bar chart + per-subject breakdown
import { useMemo } from "react";
import { Flame, Clock, Target, TrendingUp } from "lucide-react";
import { Subject, StudySession, SUBJECT_COLOR_HEX } from "@/types/study";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";

interface Props {
  subjects: Subject[];
  sessions: StudySession[];
}

const dateKey = (d: Date) => d.toISOString().split("T")[0];

export const StudyStats = ({ subjects, sessions }: Props) => {
  const stats = useMemo(() => {
    const today = dateKey(new Date());
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const todaySec = sessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.duration, 0);

    const weekSec = sessions
      .filter((s) => new Date(s.date) >= weekStart)
      .reduce((sum, s) => sum + s.duration, 0);

    const totalSec = sessions.reduce((sum, s) => sum + s.duration, 0);

    // Streak: consecutive days with at least 1 session ending today (or yesterday if none today)
    const dayHas = new Set(sessions.filter((s) => s.duration >= 60).map((s) => s.date));
    let streak = 0;
    const cur = new Date();
    if (!dayHas.has(dateKey(cur))) cur.setDate(cur.getDate() - 1);
    while (dayHas.has(dateKey(cur))) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }

    // 7-day bars
    const days: { label: string; date: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dateKey(d);
      const mins = sessions.filter((s) => s.date === k).reduce((sum, s) => sum + s.duration, 0) / 60;
      days.push({
        label: d.toLocaleDateString("en", { weekday: "short" }),
        date: k,
        minutes: Math.round(mins),
      });
    }

    // Per subject this week
    const bySubject = subjects.map((sub) => {
      const sec = sessions
        .filter((s) => s.subjectId === sub.id && new Date(s.date) >= weekStart)
        .reduce((sum, s) => sum + s.duration, 0);
      return { subject: sub, hours: sec / 3600 };
    }).sort((a, b) => b.hours - a.hours);

    return { todaySec, weekSec, totalSec, streak, days, bySubject };
  }, [subjects, sessions]);

  const fmtH = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const maxMin = Math.max(...stats.days.map((d) => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={<Clock className="w-4 h-4" />} label="Today" value={fmtH(stats.todaySec)} />
        <StatTile icon={<TrendingUp className="w-4 h-4" />} label="This Week" value={fmtH(stats.weekSec)} />
        <StatTile icon={<Flame className="w-4 h-4" />} label="Streak" value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`} accent />
        <StatTile icon={<Target className="w-4 h-4" />} label="All Time" value={fmtH(stats.totalSec)} />
      </div>

      {/* Weekly bar chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="text-sm font-medium text-foreground mb-4">Last 7 days</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.days} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8, fontSize: 12,
                }}
                formatter={(v: number) => [`${v} min`, "Studied"]}
              />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {stats.days.map((d, i) => (
                  <Cell key={i} fill={d.minutes === maxMin && d.minutes > 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject breakdown */}
      {stats.bySubject.length > 0 && stats.bySubject.some((b) => b.hours > 0) && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="text-sm font-medium text-foreground mb-4">By subject (this week)</h4>
          <div className="space-y-3">
            {stats.bySubject.map(({ subject, hours }) => {
              const goal = subject.goalHoursPerWeek ?? 0;
              const max = Math.max(goal, hours, 1);
              const pct = (hours / max) * 100;
              const hex = SUBJECT_COLOR_HEX[subject.color];
              return (
                <div key={subject.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hex }} />
                      {subject.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums text-xs">
                      {hours.toFixed(1)}h{goal > 0 && ` / ${goal}h`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: hex }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const StatTile = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className={`flex items-center gap-1.5 text-xs ${accent ? "text-primary" : "text-muted-foreground"}`}>
      {icon} {label}
    </div>
    <p className="text-2xl font-semibold text-foreground mt-1.5 tabular-nums">{value}</p>
  </div>
);
