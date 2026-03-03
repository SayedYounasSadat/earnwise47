// Break control buttons (Lunch Break, Short Break)
import { memo } from "react";
import { Coffee, UtensilsCrossed, Clock, Bath } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BreakType, DailyBreakUsage, BREAK_DURATIONS } from "@/types/earnings";
import { Progress } from "@/components/ui/progress";

interface BreakControlsProps {
  isOnBreak: boolean;
  currentBreakType: BreakType | null;
  breakDuration: number; // current break elapsed time
  breakUsage: DailyBreakUsage;
  onStartBreak: (type: BreakType) => void;
  onEndBreak: () => void;
}

// Format seconds to MM:SS
const formatBreakTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const BreakControls = memo(
  ({ isOnBreak, currentBreakType, breakDuration, breakUsage, onStartBreak, onEndBreak }: BreakControlsProps) => {
    const lunchAvailable = !breakUsage.lunchUsed;
    const shortBreaksAvailable = 2 - breakUsage.shortBreaksUsed;
    const rrBreaksAvailable = 2 - (breakUsage.rrBreaksUsed ?? 0);
    const isRRBreak = currentBreakType === "rr";

    // Calculate break progress
    const getBreakProgress = (): number => {
      if (!currentBreakType) return 0;
      const maxDuration = BREAK_DURATIONS[currentBreakType as keyof typeof BREAK_DURATIONS] || 0;
      if (maxDuration === 0) return 0;
      return Math.min((breakDuration / maxDuration) * 100, 100);
    };

    const getBreakRemaining = (): number => {
      if (!currentBreakType) return 0;
      const maxDuration = BREAK_DURATIONS[currentBreakType as keyof typeof BREAK_DURATIONS] || 0;
      return Math.max(maxDuration - breakDuration, 0);
    };

    if (isOnBreak) {
      const progress = isRRBreak ? 0 : getBreakProgress();
      const remaining = isRRBreak ? 0 : getBreakRemaining();
      const isOvertime = !isRRBreak && breakDuration > (BREAK_DURATIONS[currentBreakType as keyof typeof BREAK_DURATIONS] || 0);

      const breakLabel = currentBreakType === "lunch" ? "Lunch Break" : currentBreakType === "short" ? "Short Break" : "Restroom Break";
      const breakIcon = currentBreakType === "lunch" ? <UtensilsCrossed className="w-5 h-5 text-warning" /> : currentBreakType === "rr" ? <Bath className="w-5 h-5 text-warning" /> : <Coffee className="w-5 h-5 text-warning" />;

      return (
        <div className="glass-card rounded-xl p-4 border-2 border-warning/50 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {breakIcon}
              <span className="font-semibold text-warning">{breakLabel}</span>
            </div>
            <div className={cn(
              "text-xl font-mono font-bold",
              isOvertime ? "text-destructive animate-pulse" : "text-warning"
            )}>
              {formatBreakTime(breakDuration)}
            </div>
          </div>

          {!isRRBreak && (
            <div className="space-y-2 mb-4">
              <Progress 
                value={progress} 
                className={cn(
                  "h-3",
                  isOvertime ? "[&>div]:bg-destructive" : "[&>div]:bg-warning"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{isOvertime ? "Overtime!" : "Time remaining"}</span>
                <span>{isOvertime ? `+${formatBreakTime(breakDuration - (BREAK_DURATIONS[currentBreakType as keyof typeof BREAK_DURATIONS] || 0))}` : formatBreakTime(remaining)}</span>
              </div>
            </div>
          )}

          {isRRBreak && (
            <p className="text-xs text-muted-foreground mb-4">No time limit — take your time.</p>
          )}

          <Button
            onClick={onEndBreak}
            className={cn(
              "w-full h-12 text-lg font-semibold rounded-full",
              "bg-success hover:bg-success/90 text-success-foreground",
              "transition-all duration-200 hover:scale-105"
            )}
          >
            End Break & Resume Work
          </Button>
        </div>
      );
    }

    return (
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Take a Break</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Lunch Break Button */}
          <Button
            onClick={() => onStartBreak("lunch")}
            disabled={!lunchAvailable}
            variant="outline"
            className={cn(
              "h-auto py-3 flex flex-col gap-1 rounded-xl",
              "transition-all duration-200 hover:scale-105",
              lunchAvailable
                ? "border-warning/50 hover:bg-warning/10 hover:border-warning"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            <UtensilsCrossed className="w-5 h-5 text-warning" />
            <span className="font-semibold">Lunch</span>
            <span className="text-xs text-muted-foreground">30 min</span>
            {!lunchAvailable && (
              <span className="text-xs text-destructive">Used today</span>
            )}
          </Button>

          {/* Short Break Button */}
          <Button
            onClick={() => onStartBreak("short")}
            disabled={shortBreaksAvailable === 0}
            variant="outline"
            className={cn(
              "h-auto py-3 flex flex-col gap-1 rounded-xl",
              "transition-all duration-200 hover:scale-105",
              shortBreaksAvailable > 0
                ? "border-primary/50 hover:bg-primary/10 hover:border-primary"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            <Coffee className="w-5 h-5 text-primary" />
            <span className="font-semibold">Short</span>
            <span className="text-xs text-muted-foreground">15 min</span>
            <span className={cn(
              "text-xs",
              shortBreaksAvailable > 0 ? "text-muted-foreground" : "text-destructive"
            )}>
              {shortBreaksAvailable}/2 left
            </span>
          </Button>

          {/* RR Out Button */}
          <Button
            onClick={() => onStartBreak("rr")}
            disabled={rrBreaksAvailable === 0}
            variant="outline"
            className={cn(
              "h-auto py-3 flex flex-col gap-1 rounded-xl",
              "transition-all duration-200 hover:scale-105",
              rrBreaksAvailable > 0
                ? "border-accent/50 hover:bg-accent/10 hover:border-accent"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            <Bath className="w-5 h-5 text-accent" />
            <span className="font-semibold">RR Out</span>
            <span className="text-xs text-muted-foreground">Untimed</span>
            <span className={cn(
              "text-xs",
              rrBreaksAvailable > 0 ? "text-muted-foreground" : "text-destructive"
            )}>
              {rrBreaksAvailable}/2 left
            </span>
          </Button>
        </div>
      </div>
    );
  }
);

BreakControls.displayName = "BreakControls";