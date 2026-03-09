import { memo, useState } from "react";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shortcuts = [
  { keys: ["Space"], action: "Start / Pause / Resume", context: "Toggle timer state" },
  { keys: ["Esc"], action: "Stop session", context: "End and save current session" },
  { keys: ["R"], action: "Reset timer", context: "Reset without saving" },
];

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-muted border border-border text-xs font-mono font-semibold text-foreground shadow-sm">
    {children}
  </kbd>
);

export const KeyboardShortcutsHint = memo(() => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
      </Button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card rounded-2xl p-6 sm:p-8 max-w-sm w-full mx-4 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-lg">Keyboard Shortcuts</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {shortcuts.map((s) => (
                <div key={s.action} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{s.action}</p>
                    <p className="text-xs text-muted-foreground">{s.context}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {s.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground mt-6 text-center">
              Shortcuts are disabled when typing in input fields
            </p>
          </div>
        </div>
      )}
    </>
  );
});

KeyboardShortcutsHint.displayName = "KeyboardShortcutsHint";
