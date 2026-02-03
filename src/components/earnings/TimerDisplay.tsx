// Timer display component with animated digits
import { memo } from "react";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  seconds: number;
  isActive: boolean;
}

// Format seconds to HH:MM:SS
const formatTime = (totalSeconds: number): { hours: string; minutes: string; seconds: string } => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: secs.toString().padStart(2, "0"),
  };
};

// Individual digit component with animation
const Digit = memo(({ value, isActive }: { value: string; isActive: boolean }) => (
  <span
    className={cn(
      "inline-block w-[1.2ch] text-center transition-all duration-100",
      isActive && "animate-count"
    )}
  >
    {value}
  </span>
));

Digit.displayName = "Digit";

export const TimerDisplay = memo(({ seconds, isActive }: TimerDisplayProps) => {
  const time = formatTime(seconds);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Status indicator */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
          isActive ? "status-working" : "status-idle"
        )}
      >
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            isActive ? "bg-success-foreground animate-pulse" : "bg-muted-foreground"
          )}
        />
        {isActive ? "Working" : "Not Working"}
      </div>

      {/* Timer */}
      <div
        className={cn(
          "timer-display transition-colors duration-300",
          isActive ? "text-success" : "text-muted-foreground"
        )}
      >
        <Digit value={time.hours[0]} isActive={isActive} />
        <Digit value={time.hours[1]} isActive={isActive} />
        <span className={cn("mx-1", isActive && "animate-pulse-soft")}>:</span>
        <Digit value={time.minutes[0]} isActive={isActive} />
        <Digit value={time.minutes[1]} isActive={isActive} />
        <span className={cn("mx-1", isActive && "animate-pulse-soft")}>:</span>
        <Digit value={time.seconds[0]} isActive={isActive} />
        <Digit value={time.seconds[1]} isActive={isActive} />
      </div>

      {/* Timer labels */}
      <div className="flex gap-8 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        <span className="w-16 text-center">Hours</span>
        <span className="w-16 text-center">Minutes</span>
        <span className="w-16 text-center">Seconds</span>
      </div>
    </div>
  );
});

TimerDisplay.displayName = "TimerDisplay";
