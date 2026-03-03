// Pomodoro focus timer with configurable work/break intervals
import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PomodoroTimerProps {
  // Pomodoro is now a standalone focus tool - no work timer coupling
}

type PomodoroPhase = "work" | "shortBreak" | "longBreak" | "idle";

const DEFAULT_WORK = 25; // minutes
const DEFAULT_SHORT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;
const DEFAULT_ROUNDS = 4;

export const PomodoroTimer = memo(
  ({}: PomodoroTimerProps) => {
    const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK);
    const [shortBreakMinutes, setShortBreakMinutes] = useState(DEFAULT_SHORT_BREAK);
    const [longBreakMinutes, setLongBreakMinutes] = useState(DEFAULT_LONG_BREAK);
    const [totalRounds, setTotalRounds] = useState(DEFAULT_ROUNDS);

    const [phase, setPhase] = useState<PomodoroPhase>("idle");
    const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [currentRound, setCurrentRound] = useState(1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update initial time when settings change while idle
    useEffect(() => {
      if (phase === "idle") {
        setSecondsLeft(workMinutes * 60);
      }
    }, [workMinutes, phase]);

    // Core countdown
    useEffect(() => {
      if (isRunning && secondsLeft > 0) {
        intervalRef.current = setInterval(() => {
          setSecondsLeft((prev) => prev - 1);
        }, 1000);
      } else if (secondsLeft === 0 && isRunning) {
        // Phase complete
        handlePhaseComplete();
      }

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [isRunning, secondsLeft]);

    const handlePhaseComplete = useCallback(() => {
      setIsRunning(false);

      if (phase === "work") {
        if (currentRound >= totalRounds) {
          setPhase("longBreak");
          setSecondsLeft(longBreakMinutes * 60);
          toast({
            title: "🎉 All rounds complete!",
            description: `Great focus! Take a ${longBreakMinutes}-minute break.`,
          });
        } else {
          setPhase("shortBreak");
          setSecondsLeft(shortBreakMinutes * 60);
          toast({
            title: "☕ Short Break",
            description: `Round ${currentRound} done! Take ${shortBreakMinutes} minutes.`,
          });
        }
        setIsRunning(true);
      } else if (phase === "shortBreak") {
        setCurrentRound((prev) => prev + 1);
        setPhase("work");
        setSecondsLeft(workMinutes * 60);
        toast({
          title: "⏱️ Focus Time",
          description: `Round ${currentRound + 1} of ${totalRounds}. Let's go!`,
        });
        setIsRunning(true);
      } else if (phase === "longBreak") {
        setPhase("idle");
        setCurrentRound(1);
        setSecondsLeft(workMinutes * 60);
        toast({
          title: "✅ Pomodoro Complete",
          description: `You completed ${totalRounds} rounds of focused work!`,
        });
      }
    }, [phase, currentRound, totalRounds, workMinutes, shortBreakMinutes, longBreakMinutes]);

    const startPomodoro = () => {
      setPhase("work");
      setCurrentRound(1);
      setSecondsLeft(workMinutes * 60);
      setIsRunning(true);

      toast({
        title: "🍅 Pomodoro Started",
        description: `${workMinutes} minutes of focused work. Round 1 of ${totalRounds}.`,
      });
    };

    const togglePause = () => {
      setIsRunning((prev) => !prev);
    };

    const resetPomodoro = () => {
      setIsRunning(false);
      setPhase("idle");
      setCurrentRound(1);
      setSecondsLeft(workMinutes * 60);
    };

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const totalSeconds =
      phase === "work"
        ? workMinutes * 60
        : phase === "shortBreak"
        ? shortBreakMinutes * 60
        : phase === "longBreak"
        ? longBreakMinutes * 60
        : workMinutes * 60;
    const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

    const phaseLabel =
      phase === "work"
        ? "Focus"
        : phase === "shortBreak"
        ? "Short Break"
        : phase === "longBreak"
        ? "Long Break"
        : "Ready";

    const phaseColor =
      phase === "work"
        ? "text-primary"
        : phase === "shortBreak"
        ? "text-success"
        : phase === "longBreak"
        ? "text-accent"
        : "text-muted-foreground";

    return (
      <div className="glass-card rounded-xl p-6 card-hover">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Pomodoro Timer</h3>
          </div>

          {/* Settings popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={phase !== "idle"}>
                <Settings2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3">
              <p className="font-medium text-sm">Pomodoro Settings</p>
              <div className="space-y-2">
                <Label className="text-xs">Work (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={workMinutes}
                  onChange={(e) => setWorkMinutes(Math.max(1, Number(e.target.value)))}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Short Break (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={shortBreakMinutes}
                  onChange={(e) => setShortBreakMinutes(Math.max(1, Number(e.target.value)))}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Long Break (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={longBreakMinutes}
                  onChange={(e) => setLongBreakMinutes(Math.max(1, Number(e.target.value)))}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Rounds</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(Math.max(1, Number(e.target.value)))}
                  className="h-8"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Timer display */}
        <div className="text-center space-y-3">
          <p className={cn("text-sm font-medium uppercase tracking-wider", phaseColor)}>
            {phaseLabel}
          </p>

          {/* Circular progress */}
          <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={
                  phase === "work"
                    ? "hsl(var(--primary))"
                    : phase === "shortBreak"
                    ? "hsl(var(--success))"
                    : phase === "longBreak"
                    ? "hsl(var(--accent))"
                    : "hsl(var(--muted-foreground))"
                }
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-bold text-foreground tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Round indicators */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  i < currentRound - 1
                    ? "bg-primary"
                    : i === currentRound - 1 && phase === "work"
                    ? "bg-primary animate-pulse-soft"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Round {currentRound} of {totalRounds}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-5">
          {phase === "idle" ? (
            <Button
              onClick={startPomodoro}
              className={cn(
                "rounded-full px-6 gap-2",
                "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              <Play className="w-4 h-4" />
              Start Pomodoro
            </Button>
          ) : (
            <>
              <Button
                onClick={togglePause}
                variant="outline"
                className="rounded-full px-5 gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Resume
                  </>
                )}
              </Button>
              <Button
                onClick={resetPomodoro}
                variant="ghost"
                className="rounded-full px-4 gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
);

PomodoroTimer.displayName = "PomodoroTimer";
