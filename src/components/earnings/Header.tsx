// App header with dark mode toggle and user menu
import { memo } from "react";
import { Moon, Sun, Wallet, LogOut, User, Cloud, CloudOff, Loader2, Check } from "lucide-react";
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
}

const SyncIndicator = ({ status }: { status: "idle" | "syncing" | "synced" | "error" }) => {
  const config = {
    idle: { icon: <Cloud className="w-4 h-4 text-muted-foreground" />, label: "Cloud connected" },
    syncing: { icon: <Loader2 className="w-4 h-4 text-primary animate-spin" />, label: "Syncing..." },
    synced: { icon: <Check className="w-4 h-4 text-accent" />, label: "All changes saved" },
    error: { icon: <CloudOff className="w-4 h-4 text-destructive" />, label: "Sync failed – will retry" },
  };
  const { icon, label } = config[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground cursor-default select-none">
          {icon}
          <span className="hidden sm:inline">{status === "syncing" ? "Syncing" : status === "synced" ? "Saved" : status === "error" ? "Error" : "Cloud"}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const Header = memo(({ isDarkMode, onToggleDarkMode, syncStatus, user, onLogout }: HeaderProps) => {
  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

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

        <div className="flex items-center gap-2">
          {/* Sync indicator */}
          {user && syncStatus && <SyncIndicator status={syncStatus} />}
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
