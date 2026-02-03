// Timer control buttons (Start, Stop, Pause, Reset)
import { memo } from "react";
import { Play, Square, Pause, RotateCcw, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
  isWorking: boolean;
  isPaused: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export const TimerControls = memo(
  ({ isWorking, isPaused, onStart, onStop, onPause, onResume, onReset }: TimerControlsProps) => {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        {!isWorking && !isPaused ? (
          // Not working at all - show Start button
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
        ) : isPaused ? (
          // Paused - show Resume and Stop buttons
          <>
            <Button
              onClick={onResume}
              size="lg"
              className={cn(
                "h-14 px-8 text-lg font-semibold rounded-full",
                "bg-success hover:bg-success/90 text-success-foreground",
                "transition-all duration-200 hover:scale-105 hover:shadow-lg",
                "glow-success"
              )}
            >
              <Play className="w-5 h-5 mr-2" />
              Resume
            </Button>

            <Button
              onClick={onStop}
              size="lg"
              className={cn(
                "h-14 px-6 text-lg font-semibold rounded-full",
                "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                "transition-all duration-200 hover:scale-105"
              )}
            >
              <Square className="w-5 h-5 mr-2" />
              End Session
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
        ) : (
          // Working - show Pause and Stop buttons
          <>
            <Button
              onClick={onPause}
              size="lg"
              className={cn(
                "h-14 px-8 text-lg font-semibold rounded-full",
                "bg-warning hover:bg-warning/90 text-warning-foreground",
                "transition-all duration-200 hover:scale-105 hover:shadow-lg"
              )}
            >
              <Coffee className="w-5 h-5 mr-2" />
              Take a Break
            </Button>

            <Button
              onClick={onStop}
              size="lg"
              className={cn(
                "h-14 px-6 text-lg font-semibold rounded-full",
                "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                "transition-all duration-200 hover:scale-105"
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
