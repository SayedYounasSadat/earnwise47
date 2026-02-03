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
      "w-full rounded-2xl p-6 md:p-8 transition-all duration-500",
      isGoalReached 
        ? "bg-gradient-to-r from-success/20 via-success/10 to-success/20 border-2 border-success/30" 
        : "glass-card"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            isGoalReached ? "bg-success/20" : "bg-primary/10",
            isWorking && "animate-pulse"
          )}>
            <Target className={cn(
              "w-6 h-6",
              isGoalReached ? "text-success" : "text-primary"
            )} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Daily Goal Progress</h2>
            <p className={cn("text-sm font-medium flex items-center gap-1", tier.color)}>
              <TierIcon className="w-4 h-4" />
              {tier.label}
            </p>
          </div>
        </div>

        {isGoalReached && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success animate-scale-in">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">Completed!</span>
          </div>
        )}
      </div>

      {/* Large Progress bar */}
      <div className="relative mb-4">
        <div className="h-8 md:h-10 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden",
              isGoalReached 
                ? "bg-gradient-to-r from-success to-success/80" 
                : "bg-gradient-to-r from-accent to-accent/80"
            )}
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect when working */}
            {isWorking && !isGoalReached && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                style={{ backgroundSize: "200% 100%" }} 
              />
            )}
          </div>
        </div>
        
        {/* Percentage overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-lg md:text-xl font-bold tabular-nums",
            progress > 50 ? "text-white drop-shadow-md" : "text-foreground"
          )}>
            {progress.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm md:text-base">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-muted-foreground">Earned: </span>
            <span className="font-bold text-foreground text-lg">${currentEarnings.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Goal: </span>
            <span className="font-bold text-foreground text-lg">${dailyGoal.toFixed(2)}</span>
          </div>
        </div>

        {!isGoalReached && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="font-semibold text-accent">${remaining.toFixed(2)} to go</span>
          </div>
        )}
      </div>
    </div>
  );
});

ProgressCard.displayName = "ProgressCard";
