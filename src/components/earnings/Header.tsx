// App header with dark mode toggle
import { memo } from "react";
import { Moon, Sun, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header = memo(({ isDarkMode, onToggleDarkMode }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Earnings Tracker
            </h1>
            <p className="text-xs text-muted-foreground">Track. Earn. Achieve.</p>
          </div>
        </div>

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDarkMode}
          className={cn(
            "rounded-full transition-all duration-300",
            "hover:bg-muted hover:scale-105"
          )}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-accent transition-transform duration-300 rotate-0" />
          ) : (
            <Moon className="w-5 h-5 text-primary transition-transform duration-300 rotate-0" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
});

Header.displayName = "Header";
