// Settings card for hourly rate, exchange rate, and daily goal
import { memo, useState, useEffect } from "react";
import { Settings as SettingsIcon, DollarSign, RefreshCw, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "@/types/earnings";

interface SettingsCardProps {
  settings: Settings;
  onUpdate: (settings: Partial<Settings>) => void;
}

export const SettingsCard = memo(({ settings, onUpdate }: SettingsCardProps) => {
  const [hourlyRate, setHourlyRate] = useState(settings.hourlyRate.toString());
  const [exchangeRate, setExchangeRate] = useState(settings.exchangeRate.toString());
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal.toString());

  // Sync local state with props
  useEffect(() => {
    setHourlyRate(settings.hourlyRate.toString());
    setExchangeRate(settings.exchangeRate.toString());
    setDailyGoal(settings.dailyGoal.toString());
  }, [settings]);

  // Update hourly rate
  const handleHourlyRateChange = (value: string) => {
    setHourlyRate(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      onUpdate({ hourlyRate: num });
    }
  };

  // Update exchange rate
  const handleExchangeRateChange = (value: string) => {
    setExchangeRate(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      onUpdate({ exchangeRate: num });
    }
  };

  // Update daily goal
  const handleDailyGoalChange = (value: string) => {
    setDailyGoal(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      onUpdate({ dailyGoal: num });
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Rates & Goals</h3>
      </div>

      <div className="space-y-4">
        {/* Hourly Rate */}
        <div className="space-y-2">
          <Label htmlFor="hourlyRate" className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            Hourly Rate (USD)
          </Label>
          <Input
            id="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => handleHourlyRateChange(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Exchange Rate */}
        <div className="space-y-2">
          <Label htmlFor="exchangeRate" className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            Exchange Rate (1 USD = X {settings.currencyCode})
          </Label>
          <Input
            id="exchangeRate"
            type="number"
            min="0.01"
            step="0.01"
            value={exchangeRate}
            onChange={(e) => handleExchangeRateChange(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Daily Goal */}
        <div className="space-y-2">
          <Label htmlFor="dailyGoal" className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-muted-foreground" />
            Daily Goal (USD)
          </Label>
          <Input
            id="dailyGoal"
            type="number"
            min="0"
            step="1"
            value={dailyGoal}
            onChange={(e) => handleDailyGoalChange(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Quick stats */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            At ${settings.hourlyRate}/hr, you'll earn{" "}
            <span className="font-semibold text-foreground">
              ${(settings.hourlyRate * 8).toFixed(2)}
            </span>{" "}
            in an 8-hour day.
          </p>
        </div>
      </div>
    </div>
  );
});

SettingsCard.displayName = "SettingsCard";
