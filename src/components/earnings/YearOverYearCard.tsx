import { memo, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BudgetExpense, BudgetIncome, WorkSession } from "@/types/earnings";

interface YearOverYearCardProps {
  expenses: BudgetExpense[];
  incomes: BudgetIncome[];
  sessions?: WorkSession[];
}

interface YearTotals {
  income: number;
  expenses: number;
  net: number;
}

const computeTotals = (
  year: number,
  expenses: BudgetExpense[],
  incomes: BudgetIncome[],
  sessions: WorkSession[]
): YearTotals => {
  const prefix = `${year}-`;
  const totalExpenses = expenses
    .filter((e) => e.date.startsWith(prefix))
    .reduce((s, e) => s + e.amount, 0);
  const manualIncome = incomes
    .filter((i) => i.date.startsWith(prefix))
    .reduce((s, i) => s + i.amount, 0);
  const sessionIncome = sessions
    .filter((s) => s.date.startsWith(prefix) && s.earnings > 0)
    .reduce((s, w) => s + w.earnings, 0);
  const totalIncome = manualIncome + sessionIncome;
  return { income: totalIncome, expenses: totalExpenses, net: totalIncome - totalExpenses };
};

const Delta = ({ current, previous }: { current: number; previous: number }) => {
  if (previous === 0 && current === 0) {
    return <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5"><Minus className="w-3 h-3" />—</span>;
  }
  if (previous === 0) {
    return <span className="text-xs text-accent font-medium inline-flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />New</span>;
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const positive = pct >= 0;
  return (
    <span
      className={`text-xs font-medium inline-flex items-center gap-0.5 tabular-nums ${
        positive ? "text-accent" : "text-destructive"
      }`}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
};

export const YearOverYearCard = memo(
  ({ expenses, incomes, sessions = [] }: YearOverYearCardProps) => {
    const { thisYear, lastYear, currentYear, previousYear } = useMemo(() => {
      const cy = new Date().getFullYear();
      const py = cy - 1;
      return {
        currentYear: cy,
        previousYear: py,
        thisYear: computeTotals(cy, expenses, incomes, sessions),
        lastYear: computeTotals(py, expenses, incomes, sessions),
      };
    }, [expenses, incomes, sessions]);

    const hasData =
      thisYear.income + thisYear.expenses + lastYear.income + lastYear.expenses > 0;

    const rows: { label: string; current: number; previous: number; accent: string }[] = [
      { label: "Income", current: thisYear.income, previous: lastYear.income, accent: "text-accent" },
      { label: "Expenses", current: thisYear.expenses, previous: lastYear.expenses, accent: "text-destructive" },
      { label: "Net Savings", current: thisYear.net, previous: lastYear.net, accent: thisYear.net >= 0 ? "text-accent" : "text-destructive" },
    ];

    return (
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          {currentYear} vs {previousYear}
        </h4>

        {!hasData ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Not enough history yet. Year-over-year comparison appears as data accumulates.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1 text-xs text-muted-foreground px-1">
              <span></span>
              <span className="text-right">{previousYear}</span>
              <span className="text-right">{currentYear}</span>
              <span className="text-right">Δ</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center p-2.5 rounded-lg bg-muted/40"
              >
                <span className="text-sm text-foreground font-medium">{r.label}</span>
                <span className="text-sm tabular-nums text-muted-foreground text-right">
                  ${r.previous.toFixed(0)}
                </span>
                <span className={`text-sm font-bold tabular-nums text-right ${r.accent}`}>
                  ${r.current.toFixed(0)}
                </span>
                <span className="text-right">
                  <Delta current={r.current} previous={r.previous} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
YearOverYearCard.displayName = "YearOverYearCard";
