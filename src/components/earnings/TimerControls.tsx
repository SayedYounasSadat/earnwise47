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
  confirmReset?: boolean;
  confirmStop?: boolean;
}

const Kbd = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <kbd
    className={cn(
      "inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded",
      "bg-muted/70 border border-border/60 text-[10px] font-mono font-semibold",
      "text-muted-foreground leading-none",
      className,
    )}
  >
    {children}
  </kbd>
);

const ActionButton = ({
  onClick,
  icon: Icon,
  label,
  shortcut,
  className,
  variant = "default",
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut: string;
  className?: string;
  variant?: "default" | "outline";
}) => (
  <div className="flex flex-col items-center gap-1.5">
    <Button
      onClick={onClick}
      size="lg"
      variant={variant === "outline" ? "outline" : "default"}
      className={cn(
        "h-11 sm:h-14 px-5 sm:px-7 text-base sm:text-lg font-semibold rounded-full",
        "transition-all duration-200 hover:scale-105",
        className,
      )}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
      {label}
    </Button>
    <Kbd>{shortcut}</Kbd>
  </div>
);

export const TimerControls = memo(
  ({ isWorking, isPaused, isOnBreak, onStart, onStop, onPause, onResume, onReset }: TimerControlsProps) => {
    const [confirmStop, setConfirmStop] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    const handleStopClick = () => setConfirmStop(true);
    const handleConfirmStop = () => { setConfirmStop(false); onStop(); };
    const handleResetClick = () => setConfirmReset(true);
    const handleConfirmReset = () => { setConfirmReset(false); onReset(); };

    const stopButton = (
      <ActionButton
        onClick={handleStopClick}
        icon={Square}
        label={isOnBreak ? "End Session" : "Stop"}
        shortcut="Esc"
        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
      />
    );

    const resetButton = (
      <ActionButton
        onClick={handleResetClick}
        icon={RotateCcw}
        label="Reset"
        shortcut="R"
        variant="outline"
      />
    );

    return (
      <>
        <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
          {!isWorking && !isPaused ? (
            <ActionButton
              onClick={onStart}
              icon={Play}
              label="Start Working"
              shortcut="Space"
              className="bg-success hover:bg-success/90 text-success-foreground glow-success hover:shadow-lg"
            />
          ) : isPaused ? (
            <>
              <ActionButton
                onClick={onResume}
                icon={Play}
                label="Resume"
                shortcut="Space"
                className="bg-success hover:bg-success/90 text-success-foreground glow-success hover:shadow-lg"
              />
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
              <ActionButton
                onClick={onPause}
                icon={Pause}
                label="Quick Pause"
                shortcut="Space"
                className="bg-muted hover:bg-muted/90 text-muted-foreground hover:shadow-lg"
              />
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

        {/* Confirmation dialog for resetting */}
        <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                Reset timer?
                <Kbd className="ml-1">R</Kbd>
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will discard the current timer without saving. Your elapsed time and earnings for this session will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Timer</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

TimerControls.displayName = "TimerControls";
