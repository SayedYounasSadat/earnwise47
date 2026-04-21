// Kauri-style focus timer: stopwatch OR pomodoro mode, logs to selected subject
import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, Timer as TimerIcon, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Subject, SUBJECT_COLOR_HEX, StudySession } from "@/types/study";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
  onLogSession: (data: Omit<StudySession, "id">) => void;
}

type Mode = "stopwatch" | "pomodoro";
type Phase = "focus" | "break" | "idle";

const POMO_FOCUS_MIN = 25;
const POMO_BREAK_MIN = 5;

export const StudyTimer = ({ subjects, selectedSubjectId, onSelectSubject, onLogSession }: Props) => {
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [focusMin, setFocusMin] = useState(POMO_FOCUS_MIN);
  const [breakMin, setBreakMin] = useState(POMO_BREAK_MIN);
  const [pomoRounds, setPomoRounds] = useState(0);
  const [notes, setNotes] = useState("");
  const startRef = useRef<number | null>(null);
  const accumulatedFocusRef = useRef<number>(0); // seconds across pomodoro rounds

  const subject = subjects.find((s) => s.id === selectedSubjectId) ?? null;
  const accent = subject ? SUBJECT_COLOR_HEX[subject.color] : "hsl(var(--primary))";

  // Tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (mode === "pomodoro") {
          const target = (phase === "focus" ? focusMin : breakMin) * 60;
          if (s + 1 >= target) {
            // phase end
            if (phase === "focus") {
              accumulatedFocusRef.current += target;
              setPomoRounds((r) => r + 1);
              toast.success("Focus round done — break time ☕");
              setPhase("break");
            } else {
              toast("Break over — back to focus 🎯");
              setPhase("focus");
            }
            return 0;
          }
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode, phase, focusMin, breakMin]);

  const start = useCallback(() => {
    if (!subject) {
      toast.error("Select a subject first");
      return;
    }
    if (phase === "idle") {
      startRef.current = Date.now();
      accumulatedFocusRef.current = 0;
      setPomoRounds(0);
      setSeconds(0);
      setPhase(mode === "pomodoro" ? "focus" : "focus");
    }
    setRunning(true);
  }, [subject, phase, mode]);

  const pause = () => setRunning(false);

  const stop = useCallback(() => {
    if (!subject || !startRef.current) {
      reset();
      return;
    }
    const focusedSec = mode === "pomodoro"
      ? accumulatedFocusRef.current + (phase === "focus" ? seconds : 0)
      : seconds;

    if (focusedSec < 30) {
      toast.error("Session too short to log (< 30s)");
      reset();
      return;
    }

    const now = Date.now();
    onLogSession({
      subjectId: subject.id,
      startTime: startRef.current,
      endTime: now,
      duration: focusedSec,
      date: new Date(startRef.current).toISOString().split("T")[0],
      notes: notes.trim() || undefined,
      source: mode,
      pomodoroRounds: mode === "pomodoro" ? pomoRounds + (phase === "focus" && seconds > 0 ? 1 : 0) : undefined,
    });
    toast.success(`Logged ${(focusedSec / 60).toFixed(1)} min to ${subject.name}`);
    setNotes("");
    reset();
  }, [subject, mode, phase, seconds, pomoRounds, notes, onLogSession]);

  const reset = () => {
    setRunning(false);
    setPhase("idle");
    setSeconds(0);
    setPomoRounds(0);
    accumulatedFocusRef.current = 0;
    startRef.current = null;
  };

  // Display
  const target = mode === "pomodoro" ? (phase === "focus" ? focusMin : breakMin) * 60 : 0;
  const displaySec = mode === "pomodoro" && phase !== "idle" ? Math.max(0, target - seconds) : seconds;
  const mm = String(Math.floor(displaySec / 60)).padStart(2, "0");
  const ss = String(displaySec % 60).padStart(2, "0");
  const hh = mode === "stopwatch" ? Math.floor(displaySec / 3600) : 0;

  const progress = mode === "pomodoro" && target > 0 ? (seconds / target) * 100 : 0;
  const R = 80;
  const C = 2 * Math.PI * R;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      {/* Mode switch */}
      <div className="flex items-center justify-center gap-1 mb-6 p-1 rounded-full bg-muted w-fit mx-auto">
        <button
          onClick={() => phase === "idle" && setMode("stopwatch")}
          disabled={phase !== "idle"}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
            mode === "stopwatch" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <TimerIcon className="w-3.5 h-3.5 inline mr-1.5" /> Stopwatch
        </button>
        <button
          onClick={() => phase === "idle" && setMode("pomodoro")}
          disabled={phase !== "idle"}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
            mode === "pomodoro" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Coffee className="w-3.5 h-3.5 inline mr-1.5" /> Pomodoro
        </button>
      </div>

      {/* Subject selector pill row */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center mb-6">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => phase === "idle" && onSelectSubject(s.id)}
              disabled={phase !== "idle"}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                selectedSubjectId === s.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
              )}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: SUBJECT_COLOR_HEX[s.color] }} />
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Timer ring */}
      <div className="relative w-56 h-56 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          {mode === "pomodoro" && (
            <circle
              cx="100" cy="100" r={R} fill="none" stroke={accent}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress / 100)}
              className="transition-all duration-1000"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {mode === "pomodoro" && phase !== "idle" && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {phase === "focus" ? "Focus" : "Break"}
            </p>
          )}
          <span className="text-5xl font-mono font-light text-foreground tabular-nums tracking-tight">
            {hh > 0 ? `${hh}:${mm}` : `${mm}:${ss}`}
          </span>
          {mode === "pomodoro" && pomoRounds > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{pomoRounds} round{pomoRounds === 1 ? "" : "s"} done</p>
          )}
        </div>
      </div>

      {/* Pomodoro config (idle only) */}
      {mode === "pomodoro" && phase === "idle" && (
        <div className="grid grid-cols-2 gap-3 mt-6 max-w-xs mx-auto">
          <div className="space-y-1">
            <Label className="text-xs">Focus (min)</Label>
            <Input type="number" min={1} max={120} value={focusMin}
              onChange={(e) => setFocusMin(Math.max(1, Number(e.target.value)))} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Break (min)</Label>
            <Input type="number" min={1} max={60} value={breakMin}
              onChange={(e) => setBreakMin(Math.max(1, Number(e.target.value)))} className="h-9" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {!running && phase === "idle" ? (
          <Button onClick={start} size="lg" className="rounded-full px-8 gap-2" style={{ backgroundColor: accent, color: "white" }}>
            <Play className="w-4 h-4" /> Start
          </Button>
        ) : (
          <>
            <Button onClick={running ? pause : start} variant="outline" size="lg" className="rounded-full px-6 gap-2">
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
            </Button>
            <Button onClick={stop} variant="default" size="lg" className="rounded-full px-6 gap-2 bg-foreground text-background hover:bg-foreground/90">
              <Square className="w-4 h-4" /> Finish
            </Button>
          </>
        )}
      </div>

      {/* Notes during session */}
      {phase !== "idle" && (
        <div className="mt-6 max-w-md mx-auto">
          <Textarea
            placeholder="What are you studying? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
          />
        </div>
      )}
    </div>
  );
};
