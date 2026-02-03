// Daily goal progress card with animated progress bar
import { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressCardProps {
  currentEarnings: number;
  dailyGoal: number;
}

export const ProgressCard = memo(({ currentEarnings, dailyGoal }: ProgressCardProps) => {
  const progress = Math.min((currentEarnings / dailyGoal) * 100, 100);
  const isGoalReached = progress >= 100;
  const remaining = Math.max(dailyGoal - currentEarnings, 0);

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Daily Goal</h3>
        </div>
        {isGoalReached && (
          <div className="flex items-center gap-1 text-success animate-scale-in">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Reached!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative mb-3">
        <Progress
          value={progress}
          className={cn(
            "h-4 bg-muted",
            isGoalReached && "progress-glow"
          )}
        />
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color: progress > 50 ? "white" : "inherit" }}
        >
          {progress.toFixed(1)}%
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center text-sm">
        <div>
          <span className="text-muted-foreground">Earned: </span>
          <span className="font-semibold text-foreground">${currentEarnings.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Goal: </span>
          <span className="font-semibold text-foreground">${dailyGoal.toFixed(2)}</span>
        </div>
      </div>

      {!isGoalReached && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>${remaining.toFixed(2)} to go</span>
        </div>
      )}
    </div>
  );
});

ProgressCard.displayName = "ProgressCard";
