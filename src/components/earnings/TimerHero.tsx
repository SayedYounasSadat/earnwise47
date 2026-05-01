// Timer hero — calm, focused, single-column centerpiece
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TimerDisplay } from "./TimerDisplay";
import { EarningsDisplay } from "./EarningsDisplay";
import { TimerControls } from "./TimerControls";
import { KeyboardShortcutsHint } from "./KeyboardShortcutsHint";
import { Coffee, Pause as PauseIcon, Activity, Circle } from "lucide-react";

interface TimerHeroProps {
  isWorking: boolean;
  isPaused: boolean;
  isOnBreak: boolean;
  currentDuration: number;
  currentEarnings: number;

  exchangeRate: number;
  currencyCode: string;

  todayEarnings: number;
  dailyGoal: number;

  shiftRemaining?: string | null;
  showShiftRemaining?: boolean;

  displayName?: string | null;

  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export const TimerHero = memo((props: TimerHeroProps) => {
  const {
    isWorking, isPaused, isOnBreak, currentDuration, currentEarnings,
    exchangeRate, currencyCode, todayEarnings, dailyGoal, shiftRemaining,
    showShiftRemaining = true,
    onStart, onStop, onPause, onResume, onReset,
  } = props;

  const goalProgress = Math.min((todayEarnings / Math.max(dailyGoal, 1)) * 100, 100);
  const isGoalReached = goalProgress >= 100;

  const status = useMemo(() => {
    if (isOnBreak) return { label: "On break", icon: Coffee, dot: "bg-warning", text: "text-warning" };
    if (isPaused) return { label: "Paused", icon: PauseIcon, dot: "bg-muted-foreground", text: "text-muted-foreground" };
    if (isWorking) return { label: "Working", icon: Activity, dot: "bg-success", text: "text-success" };
    return { label: "Idle", icon: Circle, dot: "bg-muted-foreground/50", text: "text-muted-foreground" };
  }, [isWorking, isPaused, isOnBreak]);

  const StatusIcon = status.icon;

  return (
    <section className="surface-card overflow-hidden">
      {/* Slim goal bar at the very top */}
      <div className="h-1 bg-muted/60 relative">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out",
            isGoalReached ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${goalProgress}%` }}
        />
      </div>

      <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6">
        {/* Status row */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className={cn("inline-flex items-center gap-2 text-xs sm:text-sm font-medium", status.text)}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              status.dot,
              isWorking && !isPaused && !isOnBreak && "animate-pulse"
            )} />
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{status.label}</span>
          </div>

          <div className="text-[11px] sm:text-xs text-muted-foreground tabular-nums">
            {showShiftRemaining && shiftRemaining ? shiftRemaining : (
              <span>
                ${todayEarnings.toFixed(0)}<span className="opacity-50"> / ${dailyGoal.toFixed(0)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Hero: timer then earnings, centered, generous space */}
        <div className="flex flex-col items-center text-center gap-5 sm:gap-6 py-2 sm:py-4">
          <TimerDisplay
            seconds={currentDuration}
            isActive={isWorking}
            isPaused={isPaused}
            shiftRemaining={null}
          />

          <div className="w-full max-w-sm">
            <EarningsDisplay
              usdAmount={currentEarnings}
              exchangeRate={exchangeRate}
              currencyCode={currencyCode}
              isActive={isWorking && !isPaused}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-7 sm:mt-9">
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
          <div className="mt-3 flex items-center justify-center">
            <KeyboardShortcutsHint />
          </div>
        </div>
      </div>
    </section>
  );
});

TimerHero.displayName = "TimerHero";
