// Hero progress bar - prominent and visible at top
import { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressCardProps {
  currentEarnings: number;
  dailyGoal: number;
  isWorking: boolean;
}

export const ProgressCard = memo(({ currentEarnings, dailyGoal, isWorking }: ProgressCardProps) => {
  const progress = Math.min((currentEarnings / dailyGoal) * 100, 100);
  const isGoalReached = progress >= 100;
  const remaining = Math.max(dailyGoal - currentEarnings, 0);

  // Determine progress tier for visual feedback
  const getTier = () => {
    if (progress >= 100) return { label: "Goal Reached!", color: "text-success", icon: Trophy };
    if (progress >= 75) return { label: "Almost There!", color: "text-accent", icon: Flame };
    if (progress >= 50) return { label: "Halfway!", color: "text-primary", icon: TrendingUp };
    return { label: "Keep Going!", color: "text-muted-foreground", icon: Target };
  };

  const tier = getTier();
  const TierIcon = tier.icon;

  return (
    <div className={cn(
      "w-full rounded-2xl p-4 sm:p-6 md:p-8 transition-all duration-500",
      isGoalReached 
        ? "bg-gradient-to-r from-success/20 via-success/10 to-success/20 border-2 border-success/30" 
        : "glass-card"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn(
            "p-2 sm:p-3 rounded-xl transition-all duration-300",
            isGoalReached ? "bg-success/20" : "bg-primary/10",
            isWorking && "animate-pulse"
          )}>
            <Target className={cn(
              "w-5 h-5 sm:w-6 sm:h-6",
              isGoalReached ? "text-success" : "text-primary"
            )} />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-foreground">Daily Goal</h2>
            <p className={cn("text-xs sm:text-sm font-medium flex items-center gap-1", tier.color)}>
              <TierIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tier.label}
            </p>
          </div>
        </div>

        {isGoalReached && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-success/20 text-success animate-scale-in">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-bold text-xs sm:text-sm">Done!</span>
          </div>
        )}
      </div>

      {/* Large Progress bar */}
      <div className="relative mb-3 sm:mb-4">
        <div className="h-6 sm:h-8 md:h-10 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden",
              isGoalReached 
                ? "bg-gradient-to-r from-success to-success/80" 
                : "bg-gradient-to-r from-accent to-accent/80"
            )}
            style={{ width: `${progress}%` }}
          >
            {isWorking && !isGoalReached && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                style={{ backgroundSize: "200% 100%" }} 
              />
            )}
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-sm sm:text-lg md:text-xl font-bold tabular-nums",
            progress > 50 ? "text-white drop-shadow-md" : "text-foreground"
          )}>
            {progress.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-sm">
        <div className="flex items-center gap-3 sm:gap-6">
          <div>
            <span className="text-muted-foreground text-xs sm:text-sm">Earned: </span>
            <span className="font-bold text-foreground text-base sm:text-lg">${currentEarnings.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs sm:text-sm">Goal: </span>
            <span className="font-bold text-foreground text-base sm:text-lg">${dailyGoal.toFixed(2)}</span>
          </div>
        </div>

        {!isGoalReached && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            <span className="font-semibold text-accent text-xs sm:text-sm">${remaining.toFixed(2)} to go</span>
          </div>
        )}
      </div>
    </div>
  );
});

ProgressCard.displayName = "ProgressCard";
