import { useEffect, useCallback } from "react";

interface UseKeyboardShortcutsProps {
  isWorking: boolean;
  isPaused: boolean;
  isOnBreak: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export const useKeyboardShortcuts = ({
  isWorking, isPaused, isOnBreak,
  onStart, onStop, onPause, onResume, onReset,
}: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    // Don't trigger if a dialog is open
    if (document.querySelector("[role='alertdialog']")) return;

    switch (e.code) {
      case "Space": {
        e.preventDefault();
        if (!isWorking && !isPaused) {
          onStart();
        } else if (isPaused) {
          onResume();
        } else if (isWorking && !isOnBreak) {
          onPause();
        }
        break;
      }
      case "Escape": {
        if (isWorking || isPaused) {
          e.preventDefault();
          onStop();
        }
        break;
      }
      case "KeyR": {
        if ((isWorking || isPaused) && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onReset();
        }
        break;
      }
    }
  }, [isWorking, isPaused, isOnBreak, onStart, onStop, onPause, onResume, onReset]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
