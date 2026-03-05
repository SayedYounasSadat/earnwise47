// Timer control buttons (Start, Stop, Pause, Reset) with mobile-optimized layout
import { memo, useState } from "react";
import { Play, Square, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimerControlsProps {
  isWorking: boolean;
  isPaused: boolean;
  isOnBreak: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export const TimerControls = memo(
  ({ isWorking, isPaused, isOnBreak, onStart, onStop, onPause, onResume, onReset }: TimerControlsProps) => {
    const [confirmStop, setConfirmStop] = useState(false);

    const handleStopClick = () => setConfirmStop(true);
    const handleConfirmStop = () => { setConfirmStop(false); onStop(); };

    const stopButton = (
      <Button
        onClick={handleStopClick}
        size="lg"
        className={cn(
          "h-11 sm:h-14 px-4 sm:px-6 text-base sm:text-lg font-semibold rounded-full",
          "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
          "transition-all duration-200 hover:scale-105"
        )}
      >
        <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
        {isOnBreak ? "End Session" : "Stop"}
      </Button>
    );

    const resetButton = (
      <Button
        onClick={onReset}
        size="lg"
        variant="outline"
        className={cn(
          "h-11 sm:h-14 px-4 sm:px-6 text-base sm:text-lg font-semibold rounded-full",
          "transition-all duration-200 hover:scale-105"
        )}
      >
        <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
        Reset
      </Button>
    );

    return (
      <>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
          {!isWorking && !isPaused ? (
            <Button
              onClick={onStart}
              size="lg"
              className={cn(
                "h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-full",
                "bg-success hover:bg-success/90 text-success-foreground",
                "transition-all duration-200 hover:scale-105 hover:shadow-lg",
                "glow-success"
              )}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
              Start Working
            </Button>
          ) : isPaused ? (
            <>
              <Button
                onClick={onResume}
                size="lg"
                className={cn(
                  "h-11 sm:h-14 px-5 sm:px-8 text-base sm:text-lg font-semibold rounded-full",
                  "bg-success hover:bg-success/90 text-success-foreground",
                  "transition-all duration-200 hover:scale-105 hover:shadow-lg",
                  "glow-success"
                )}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                Resume
              </Button>
              {stopButton}
              {resetButton}
            </>
          ) : isOnBreak ? (
            <>
              {stopButton}
              {resetButton}
            </>
          ) : (
            <>
              <Button
                onClick={onPause}
                size="lg"
                className={cn(
                  "h-11 sm:h-14 px-5 sm:px-8 text-base sm:text-lg font-semibold rounded-full",
                  "bg-muted hover:bg-muted/90 text-muted-foreground",
                  "transition-all duration-200 hover:scale-105 hover:shadow-lg"
                )}
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                Quick Pause
              </Button>
              {stopButton}
              {resetButton}
            </>
          )}
        </div>

        {/* Confirmation dialog for stopping */}
        <AlertDialog open={confirmStop} onOpenChange={setConfirmStop}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will save the current session to your logs. You can always add notes before stopping.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Working</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmStop} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                End Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

TimerControls.displayName = "TimerControls";
