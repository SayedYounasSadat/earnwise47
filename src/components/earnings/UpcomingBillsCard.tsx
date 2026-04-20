import { memo, useMemo } from "react";
import { Bell, AlertCircle, CalendarClock } from "lucide-react";
import { BudgetExpense, EXPENSE_CATEGORY_LABELS } from "@/types/earnings";
import { Badge } from "@/components/ui/badge";

interface UpcomingBillsCardProps {
  expenses: BudgetExpense[];
}

interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate: Date;
  daysUntil: number;
}

/**
 * Predicts upcoming recurring bills based on the day-of-month from the
 * most recent occurrence of each recurring expense. Looks 30 days ahead.
 */
export const UpcomingBillsCard = memo(({ expenses }: UpcomingBillsCardProps) => {
  const upcoming = useMemo<UpcomingBill[]>(() => {
    const recurring = expenses.filter((e) => e.recurring);
    if (recurring.length === 0) return [];

    // Group by name+amount to find most recent occurrence of each bill
    const grouped = new Map<string, BudgetExpense>();
    for (const e of recurring) {
      const key = `${e.name}|${e.amount}`;
      const existing = grouped.get(key);
      if (!existing || e.date > existing.date) grouped.set(key, e);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 30);

    const bills: UpcomingBill[] = [];
    grouped.forEach((bill) => {
      const lastDate = new Date(bill.date);
      const dayOfMonth = lastDate.getDate();
      // Project next due: same day-of-month, this month or next
      let next = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
      if (next < today) {
        next = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
      }
      if (next > horizon) return;
      const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
      bills.push({
        id: bill.id,
        name: bill.name,
        amount: bill.amount,
        category: EXPENSE_CATEGORY_LABELS[bill.category] ?? bill.category,
        dueDate: next,
        daysUntil,
      });
    });

    return bills.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [expenses]);

  const totalUpcoming = upcoming.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Upcoming Bills (30 days)
        </h4>
        {upcoming.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            ${totalUpcoming.toFixed(0)} total
          </Badge>
        )}
      </div>

      {upcoming.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No upcoming recurring bills. Mark expenses as recurring to see predictions.
        </p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((bill) => {
            const urgent = bill.daysUntil <= 3;
            const soon = bill.daysUntil <= 7 && !urgent;
            return (
              <li
                key={bill.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      urgent
                        ? "bg-destructive/15 text-destructive"
                        : soon
                        ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {urgent ? <AlertCircle className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{bill.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{bill.category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums text-foreground">${bill.amount.toFixed(2)}</p>
                  <p
                    className={`text-xs tabular-nums ${
                      urgent ? "text-destructive font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {bill.daysUntil === 0 ? "Today" : bill.daysUntil === 1 ? "Tomorrow" : `in ${bill.daysUntil}d`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
UpcomingBillsCard.displayName = "UpcomingBillsCard";
