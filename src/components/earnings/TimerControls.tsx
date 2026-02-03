// Timer control buttons (Start, Stop, Reset)
import { memo } from "react";
import { Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
  isWorking: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const TimerControls = memo(
  ({ isWorking, onStart, onStop, onReset }: TimerControlsProps) => {
    return (
      <div className="flex items-center justify-center gap-4">
        {!isWorking ? (
          <Button
            onClick={onStart}
            size="lg"
            className={cn(
              "h-14 px-8 text-lg font-semibold rounded-full",
              "bg-success hover:bg-success/90 text-success-foreground",
              "transition-all duration-200 hover:scale-105 hover:shadow-lg",
              "glow-success"
            )}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Working
          </Button>
        ) : (
          <>
            <Button
              onClick={onStop}
              size="lg"
              className={cn(
                "h-14 px-8 text-lg font-semibold rounded-full",
                "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                "transition-all duration-200 hover:scale-105 hover:shadow-lg"
              )}
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>

            <Button
              onClick={onReset}
              size="lg"
              variant="outline"
              className={cn(
                "h-14 px-6 text-lg font-semibold rounded-full",
                "transition-all duration-200 hover:scale-105"
              )}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </>
        )}
      </div>
    );
  }
);

TimerControls.displayName = "TimerControls";
