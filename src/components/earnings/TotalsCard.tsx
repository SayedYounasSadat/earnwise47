// Earnings totals card (daily, weekly, monthly)
import { memo } from "react";
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";

interface TotalsCardProps {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  exchangeRate: number;
  currencyCode: string;
}

const TotalItem = memo(
  ({
    icon: Icon,
    label,
    usdAmount,
    localAmount,
    currencyCode,
  }: {
    icon: React.ElementType;
    label: string;
    usdAmount: number;
    localAmount: number;
    currencyCode: string;
  }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground">${usdAmount.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">
            ({localAmount.toFixed(0)} {currencyCode})
          </span>
        </div>
      </div>
    </div>
  )
);

TotalItem.displayName = "TotalItem";

export const TotalsCard = memo(
  ({ todayEarnings, weekEarnings, monthEarnings, exchangeRate, currencyCode }: TotalsCardProps) => {
    return (
      <div className="glass-card rounded-xl p-6 card-hover">
        <h3 className="font-semibold text-foreground mb-4">Earnings Summary</h3>

        <div className="space-y-3">
          <TotalItem
            icon={Calendar}
            label="Today"
            usdAmount={todayEarnings}
            localAmount={todayEarnings * exchangeRate}
            currencyCode={currencyCode}
          />
          <TotalItem
            icon={CalendarDays}
            label="This Week"
            usdAmount={weekEarnings}
            localAmount={weekEarnings * exchangeRate}
            currencyCode={currencyCode}
          />
          <TotalItem
            icon={CalendarRange}
            label="This Month"
            usdAmount={monthEarnings}
            localAmount={monthEarnings * exchangeRate}
            currencyCode={currencyCode}
          />
        </div>
      </div>
    );
  }
);

TotalsCard.displayName = "TotalsCard";
