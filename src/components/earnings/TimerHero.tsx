// Timer hero — calm, focused, single-column centerpiece
import { memo, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TimerDisplay } from "./TimerDisplay";
import { EarningsDisplay } from "./EarningsDisplay";
import { TimerControls } from "./TimerControls";
import { KeyboardShortcutsHint } from "./KeyboardShortcutsHint";
import { Coffee, Pause as PauseIcon, Activity, Circle, Maximize2, Minimize2 } from "lucide-react";

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
  confirmReset?: boolean;
  confirmStop?: boolean;
}

export const TimerHero = memo((props: TimerHeroProps) => {
  const {
    isWorking, isPaused, isOnBreak, currentDuration, currentEarnings,
    exchangeRate, currencyCode, todayEarnings, dailyGoal, shiftRemaining,
    showShiftRemaining = true,
    onStart, onStop, onPause, onResume, onReset,
    confirmReset = true, confirmStop = true,
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
    <section className="surface-card overflow-hidden tech-stage border-primary/20">
      {/* Corner brackets */}
      <span className="tech-corner tl" />
      <span className="tech-corner tr" />
      <span className="tech-corner bl" />
      <span className="tech-corner br" />

      {/* Slim goal bar at the very top */}
      <div className="h-[3px] bg-primary/10 relative z-10">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out",
            isGoalReached ? "bg-success" : "bg-gradient-to-r from-primary/70 via-primary to-primary/70"
          )}
          style={{
            width: `${goalProgress}%`,
            boxShadow: "0 0 12px hsl(var(--primary) / 0.7)",
          }}
        />
      </div>

      <div className="relative z-10 px-5 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8">
        {/* Status / HUD readouts */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="tech-label flex items-center gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
            SYS::EARNWISE_v2
          </div>
          <div className="tech-label tabular-nums opacity-80">
            {showShiftRemaining && shiftRemaining
              ? `ETA ${shiftRemaining}`
              : `GOAL ${todayEarnings.toFixed(0)} / ${dailyGoal.toFixed(0)}`}
          </div>
        </div>

        {/* Hero: HUD timer + earnings */}
        <div className="flex flex-col items-center text-center gap-5 sm:gap-7 py-1 sm:py-3">
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
            confirmReset={confirmReset}
            confirmStop={confirmStop}
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
