import { memo, useMemo } from "react";
import { Wallet, TrendingUp, PiggyBank, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useBudget } from "@/hooks/useBudget";
import { WorkSession } from "@/types/earnings";

interface Props {
  sessions: WorkSession[];
}

export const FinancialHealthCard = memo(({ sessions }: Props) => {
  // Compute synced earnings for current month from work sessions
  const syncedEarnings = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return sessions
      .filter((s) => s.date.startsWith(monthKey) && s.earnings > 0)
      .map((s) => ({
        source: "Work Session",
        amount: s.earnings,
        date: s.date,
      }));
  }, [sessions]);

  const { monthlyBudget, savingsGoals, monthStats } = useBudget({ syncedEarnings });

  const netFlow = monthStats.totalIncome - monthStats.totalExpenses;
  const budgetPct = monthlyBudget > 0 ? (monthStats.totalExpenses / monthlyBudget) * 100 : 0;
  const totalSavings = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const savingsPct = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;

  const isHealthy = netFlow >= 0 && budgetPct < 90;

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          Financial Health
        </h3>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            isHealthy
              ? "bg-accent/15 text-accent"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {isHealthy ? "On Track" : "Watch"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
            <TrendingUp className="w-3 h-3" />
            Net
          </div>
          <p
            className={`text-sm font-bold tabular-nums ${
              netFlow >= 0 ? "text-accent" : "text-destructive"
            }`}
          >
            {netFlow >= 0 ? "+" : ""}${netFlow.toFixed(0)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
            <Wallet className="w-3 h-3" />
            Budget
          </div>
          <p className="text-sm font-bold tabular-nums text-foreground">
            {monthlyBudget > 0 ? `${budgetPct.toFixed(0)}%` : "—"}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
            <PiggyBank className="w-3 h-3" />
            Savings
          </div>
          <p className="text-sm font-bold tabular-nums text-primary">
            {totalTarget > 0 ? `${savingsPct.toFixed(0)}%` : "—"}
          </p>
        </div>
      </div>

      {monthlyBudget > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Budget used</span>
            <span className="tabular-nums">
              ${monthStats.totalExpenses.toFixed(0)} / ${monthlyBudget.toFixed(0)}
            </span>
          </div>
          <Progress
            value={Math.min(budgetPct, 100)}
            className={`h-1.5 ${
              budgetPct > 90
                ? "[&>div]:bg-destructive"
                : budgetPct > 70
                ? "[&>div]:bg-yellow-500"
                : ""
            }`}
          />
        </div>
      )}

      {monthStats.syncedIncomeTotal > 0 && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          ${monthStats.syncedIncomeTotal.toFixed(2)} auto-synced from work sessions
        </p>
      )}
    </div>
  );
});
FinancialHealthCard.displayName = "FinancialHealthCard";
