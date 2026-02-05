// App header with dark mode toggle and user menu
import { memo } from "react";
import { Moon, Sun, Wallet, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  user?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  onLogout?: () => void;
}

export const Header = memo(({ isDarkMode, onToggleDarkMode, user, onLogout }: HeaderProps) => {
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
