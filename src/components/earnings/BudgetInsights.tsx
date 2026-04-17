import { memo } from "react";
import { TrendingUp, TrendingDown, Sparkles, AlertTriangle } from "lucide-react";
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from "@/types/earnings";

interface Props {
  totalIncome: number;
  totalExpenses: number;
  monthlyBudget: number;
  topCategory: { category: ExpenseCategory; amount: number } | null;
}

export const BudgetInsights = memo(({ totalIncome, totalExpenses, monthlyBudget, topCategory }: Props) => {
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const budgetPct = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  const insights: { icon: React.ReactNode; text: string; tone: "good" | "warn" | "info" }[] = [];

  if (totalIncome > 0) {
    if (savingsRate >= 20) {
      insights.push({
        icon: <Sparkles className="w-4 h-4" />,
        text: `Great job! You're saving ${savingsRate.toFixed(0)}% of your income this month.`,
        tone: "good",
      });
    } else if (savingsRate >= 0) {
      insights.push({
        icon: <TrendingUp className="w-4 h-4" />,
        text: `You're saving ${savingsRate.toFixed(0)}%. Aim for 20%+ for healthy financial growth.`,
        tone: "info",
      });
    } else {
      insights.push({
        icon: <AlertTriangle className="w-4 h-4" />,
        text: `You're spending more than you earn this month. Review your expenses.`,
        tone: "warn",
      });
    }
  }

  if (monthlyBudget > 0) {
    if (budgetPct > 100) {
      insights.push({
        icon: <AlertTriangle className="w-4 h-4" />,
        text: `Over budget by $${(totalExpenses - monthlyBudget).toFixed(2)}.`,
        tone: "warn",
      });
    } else if (budgetPct > 80) {
      insights.push({
        icon: <TrendingDown className="w-4 h-4" />,
        text: `You've used ${budgetPct.toFixed(0)}% of your budget — slow down on spending.`,
        tone: "warn",
      });
    }
  }

  if (topCategory && topCategory.amount > 0 && totalExpenses > 0) {
    const pct = (topCategory.amount / totalExpenses) * 100;
    insights.push({
      icon: <TrendingDown className="w-4 h-4" />,
      text: `Top spending: ${EXPENSE_CATEGORY_LABELS[topCategory.category]} ($${topCategory.amount.toFixed(2)}, ${pct.toFixed(0)}% of expenses).`,
      tone: "info",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: <Sparkles className="w-4 h-4" />,
      text: "Add some expenses and income to see personalized insights.",
      tone: "info",
    });
  }

  const toneClass = (tone: "good" | "warn" | "info") =>
    tone === "good"
      ? "text-accent bg-accent/10 border-accent/20"
      : tone === "warn"
      ? "text-destructive bg-destructive/10 border-destructive/20"
      : "text-foreground bg-muted/50 border-border";

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Insights
      </h4>
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${toneClass(ins.tone)}`}
          >
            <span className="shrink-0 mt-0.5">{ins.icon}</span>
            <span className="leading-relaxed">{ins.text}</span>
          </div>
        ))}
      </div>
      {totalIncome > 0 && (
        <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Savings Rate</span>
          <span
            className={`font-bold tabular-nums ${
              savingsRate >= 20 ? "text-accent" : savingsRate >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {savingsRate.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
});
BudgetInsights.displayName = "BudgetInsights";
