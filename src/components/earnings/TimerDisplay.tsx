// Techy timer display — circular HUD with glowing digits
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Coffee, Activity, Pause as PauseIcon, Power } from "lucide-react";

interface TimerDisplayProps {
  seconds: number;
  isActive: boolean;
  isPaused: boolean;
  shiftRemaining?: string | null;
}

const pad = (n: number) => n.toString().padStart(2, "0");

export const TimerDisplay = memo(({ seconds, isActive, isPaused }: TimerDisplayProps) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const state = isPaused ? "paused" : isActive ? "active" : "idle";

  // Ring progress: minute progress (0–60s) for an always-visible HUD pulse
  const ringProgress = (s / 60) * 100;
  const R = 130;
  const C = 2 * Math.PI * R;

  const StatusIcon = isPaused ? Coffee : isActive ? Activity : Power;
  const statusLabel = isPaused ? "ON BREAK" : isActive ? "TRACKING" : "STANDBY";

  return (
    <div className="relative flex flex-col items-center gap-4 select-none">
      {/* Status chip */}
      <div className={cn("tech-chip flex items-center", state === "paused" && "paused", state === "idle" && "idle")}>
        <span className="dot" />
        <StatusIcon className="w-3 h-3 mr-1.5 inline" />
        {statusLabel}
      </div>

      {/* HUD ring + digits */}
      <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
        {/* Outer dashed orbit */}
        <svg className="absolute inset-0 w-full h-full tech-orbit opacity-50" viewBox="0 0 320 320">
          <circle cx="160" cy="160" r="155" fill="none"
            stroke="hsl(175 80% 55% / 0.35)" strokeWidth="1"
            strokeDasharray="2 8" />
        </svg>

        {/* Tick marks */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
          {Array.from({ length: 60 }).map((_, i) => {
            const isMajor = i % 5 === 0;
            const len = isMajor ? 10 : 4;
            const angle = (i * 6 - 90) * (Math.PI / 180);
            const x1 = 160 + Math.cos(angle) * 145;
            const y1 = 160 + Math.sin(angle) * 145;
            const x2 = 160 + Math.cos(angle) * (145 - len);
            const y2 = 160 + Math.sin(angle) * (145 - len);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMajor ? "hsl(175 80% 60% / 0.55)" : "hsl(175 60% 55% / 0.22)"}
                strokeWidth={isMajor ? 1.5 : 1} strokeLinecap="round" />
            );
          })}
        </svg>

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 320 320">
          <circle cx="160" cy="160" r={R} fill="none" strokeWidth="3"
            className="tech-ring-track" />
          <circle cx="160" cy="160" r={R} fill="none" strokeWidth="3" strokeLinecap="round"
            className={cn("tech-ring-fill", state === "paused" && "paused", state === "idle" && "idle")}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - ringProgress / 100)} />
        </svg>

        {/* Inner ring decoration */}
        <div className="absolute w-[230px] h-[230px] sm:w-[250px] sm:h-[250px] rounded-full border border-primary/15" />
        <div className="absolute w-[230px] h-[230px] sm:w-[250px] sm:h-[250px] rounded-full border border-primary/10 blur-sm" />

        {/* Center digits */}
        <div className="relative z-10 flex flex-col items-center gap-1.5">
          <div className="tech-label">ELAPSED</div>
          <div className={cn(
            "tech-digits text-4xl sm:text-5xl flex items-baseline",
            state === "paused" && "is-paused",
            state === "idle" && "is-idle",
          )}>
            <span className="tabular-nums">{pad(h)}</span>
            <span className={cn("tech-colon mx-1", isActive && !isPaused && "tech-flicker")}>:</span>
            <span className="tabular-nums">{pad(m)}</span>
            <span className={cn("tech-colon mx-1", isActive && !isPaused && "tech-flicker")}>:</span>
            <span className="tabular-nums">{pad(s)}</span>
          </div>
          <div className="flex gap-3 mt-1 tech-label opacity-70">
            <span>HRS</span><span>MIN</span><span>SEC</span>
          </div>
        </div>
      </div>
    </div>
  );
});

TimerDisplay.displayName = "TimerDisplay";
