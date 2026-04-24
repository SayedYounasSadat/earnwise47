// App header with dark mode toggle and user menu
import { memo, type ReactNode } from "react";
import { Moon, Sun, Wallet, LogOut, User, Cloud, CloudOff, Loader2, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  syncStatus?: "idle" | "syncing" | "synced" | "error";
  user?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  onLogout?: () => void;
  sidebarTrigger?: ReactNode;
  currentSection?: string;
  onOpenCommand?: () => void;
}

const SyncIndicator = ({ status }: { status: "idle" | "syncing" | "synced" | "error" }) => {
  const config = {
    idle: { icon: <Cloud className="w-3.5 h-3.5 text-muted-foreground" />, label: "Cloud connected" },
    syncing: { icon: <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />, label: "Syncing..." },
    synced: { icon: <Check className="w-3.5 h-3.5 text-success" />, label: "All changes saved" },
    error: { icon: <CloudOff className="w-3.5 h-3.5 text-destructive" />, label: "Offline – will retry when reconnected" },
  };
  const { icon, label } = config[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground cursor-default select-none hover:bg-muted/60 transition-colors">
          {icon}
          <span className="hidden md:inline">
            {status === "syncing" ? "Syncing" : status === "synced" ? "Saved" : status === "error" ? "Offline" : "Cloud"}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const Header = memo(({ isDarkMode, onToggleDarkMode, syncStatus, user, onLogout, sidebarTrigger, currentSection, onOpenCommand }: HeaderProps) => {
  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
        {/* Left: trigger + brand + section context */}
        <div className="flex items-center gap-2 min-w-0">
          {sidebarTrigger}
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm shrink-0">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-base font-semibold text-foreground tracking-tight hidden sm:block">
              EarnWise
            </h1>
            {currentSection && (
              <>
                <span className="text-muted-foreground/50 hidden sm:inline" aria-hidden>/</span>
                <span className="text-sm font-medium text-muted-foreground truncate">{currentSection}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Command palette */}
          {onOpenCommand && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onOpenCommand}
                  className={cn(
                    "hidden md:inline-flex items-center gap-2 h-8 px-2.5 rounded-md",
                    "text-xs text-muted-foreground border border-border/70 bg-muted/40",
                    "hover:bg-muted hover:text-foreground transition-colors"
                  )}
                  aria-label="Search & quick navigate"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                  <kbd className="ml-1 px-1.5 py-0.5 rounded bg-background/80 border border-border/70 text-[10px] font-mono">⌘K</kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Quick navigate (⌘K)</p></TooltipContent>
            </Tooltip>
          )}
          {/* Sync indicator */}
          {user && syncStatus && <SyncIndicator status={syncStatus} />}
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            className="h-9 w-9 rounded-full hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-[18px] h-[18px] text-accent" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-primary" />
            )}
          </Button>

          {/* User menu */}
          {user && onLogout && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium text-foreground leading-none">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-none">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";
