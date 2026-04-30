// Timer hero — refined minimal centerpiece with goal-ring around the timer
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TimerDisplay } from "./TimerDisplay";
import { EarningsDisplay } from "./EarningsDisplay";
import { TimerControls } from "./TimerControls";
import { KeyboardShortcutsHint } from "./KeyboardShortcutsHint";
import { Coffee, Pause as PauseIcon, Activity, Sparkles, TrendingUp, Trophy, Target } from "lucide-react";

interface TimerHeroProps {
  // timer state
  isWorking: boolean;
  isPaused: boolean;
  isOnBreak: boolean;
  currentDuration: number;
  currentEarnings: number;

  // earnings settings
  exchangeRate: number;
  currencyCode: string;

  // daily progress
  todayEarnings: number;
  dailyGoal: number;

  // optional shift hint
  shiftRemaining?: string | null;
  showShiftRemaining?: boolean;

  // user
  displayName?: string | null;

  // actions
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

const greet = () => {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

export const TimerHero = memo((props: TimerHeroProps) => {
  const {
    isWorking, isPaused, isOnBreak, currentDuration, currentEarnings,
    exchangeRate, currencyCode, todayEarnings, dailyGoal, shiftRemaining,
    showShiftRemaining = true, displayName,
    onStart, onStop, onPause, onResume, onReset,
  } = props;

  const goalProgress = Math.min((todayEarnings / Math.max(dailyGoal, 1)) * 100, 100);
  const goalRemaining = Math.max(dailyGoal - todayEarnings, 0);
  const isGoalReached = goalProgress >= 100;

  // ring math
  const size = 280;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (goalProgress / 100) * circumference;

  // pace per hour, only meaningful when we have some duration
  const pacePerHour = useMemo(() => {
    if (currentDuration < 30) return 0;
    return (currentEarnings / currentDuration) * 3600;
  }, [currentEarnings, currentDuration]);

  const status = isOnBreak
    ? { label: "On break", icon: Coffee, ring: "stroke-warning", chip: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning" }
    : isPaused
      ? { label: "Paused", icon: PauseIcon, ring: "stroke-muted-foreground", chip: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" }
      : isWorking
        ? { label: "Working", icon: Activity, ring: "stroke-success", chip: "bg-success/10 text-success border-success/30", dot: "bg-success" }
        : { label: "Idle", icon: Sparkles, ring: "stroke-primary/60", chip: "bg-muted/60 text-muted-foreground border-border", dot: "bg-muted-foreground/60" };

  const StatusIcon = status.icon;

  return (
    <section className="surface-card p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden relative">
      {/* Soft ambient gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.06), transparent 70%)",
        }}
      />

      <div className="relative">
        {/* Greeting + status */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5 sm:mb-6">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              {greet()}{displayName ? "," : ""}
            </p>
            {displayName && (
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground truncate">
                {displayName.split(" ")[0]}
              </h2>
            )}
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isWorking
                ? isOnBreak
                  ? "Take your time — your session is paused."
                  : isPaused
                    ? "Resume when you're ready to continue."
                    : "You're earning right now. Keep it up."
                : "Hit start when you're ready to log time."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
              status.chip
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", status.dot, isWorking && !isPaused && !isOnBreak && "animate-pulse")} />
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
            {showShiftRemaining && shiftRemaining && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border border-border bg-muted/50 text-muted-foreground">
                ⏰ {shiftRemaining}
              </span>
            )}
          </div>
        </div>

        {/* Hero grid: ring+timer | earnings */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 items-center">
          {/* Ring around timer */}
          <div className="flex items-center justify-center">
            <div className="relative" style={{ width: size, height: size, maxWidth: "100%" }}>
              <svg
                viewBox={`0 0 ${size} ${size}`}
                className="w-full h-full -rotate-90"
                aria-hidden
              >
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={stroke}
                  className="stroke-muted fill-none"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  className={cn(
                    "fill-none transition-all duration-700 ease-out",
                    isGoalReached ? "stroke-success" : status.ring
                  )}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                <TimerDisplay
                  seconds={currentDuration}
                  isActive={isWorking}
                  isPaused={isPaused}
                  shiftRemaining={null}
                />
              </div>
            </div>
          </div>

          {/* Earnings + goal mini summary */}
          <div className="flex flex-col items-center md:items-start gap-5 md:pl-4 md:border-l md:border-border">
            <EarningsDisplay
              usdAmount={currentEarnings}
              exchangeRate={exchangeRate}
              currencyCode={currencyCode}
              isActive={isWorking && !isPaused}
            />

            {/* Goal mini-row */}
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  {isGoalReached
                    ? <Trophy className="w-3.5 h-3.5 text-success" />
                    : <Target className="w-3.5 h-3.5" />}
                  Daily goal
                </span>
                <span className="tabular-nums font-medium text-foreground">
                  ${todayEarnings.toFixed(0)} <span className="text-muted-foreground">/ ${dailyGoal.toFixed(0)}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    isGoalReached ? "bg-success" : "bg-gradient-to-r from-primary to-accent"
                  )}
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                <span>{goalProgress.toFixed(0)}% complete</span>
                {isGoalReached
                  ? <span className="text-success font-medium">Goal reached 🎉</span>
                  : <span>${goalRemaining.toFixed(2)} to go</span>}
              </div>
            </div>

            {/* Live pace */}
            {pacePerHour > 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                <span>Pace</span>
                <span className="tabular-nums font-semibold text-foreground">${pacePerHour.toFixed(2)}/hr</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border space-y-3">
          <div className="flex items-center justify-center">
            <KeyboardShortcutsHint />
          </div>
          <TimerControls
            isWorking={isWorking}
            isPaused={isPaused}
            isOnBreak={isOnBreak}
            onStart={onStart}
            onStop={onStop}
            onPause={onPause}
            onResume={onResume}
            onReset={onReset}
          />
        </div>
      </div>
    </section>
  );
});

TimerHero.displayName = "TimerHero";
