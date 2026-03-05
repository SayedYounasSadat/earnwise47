// Settings card for hourly rate, exchange rate, and daily goal
import { memo, useState, useEffect } from "react";
import { Settings as SettingsIcon, DollarSign, RefreshCw, Target, Clock, Timer, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "@/types/earnings";

interface SettingsCardProps {
  settings: Settings;
  onUpdate: (settings: Partial<Settings>) => void;
}

export const SettingsCard = memo(({ settings, onUpdate }: SettingsCardProps) => {
  const [hourlyRate, setHourlyRate] = useState(settings.hourlyRate.toString());
  const [exchangeRate, setExchangeRate] = useState(settings.exchangeRate.toString());
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal.toString());
  const [overtimeMultiplier, setOvertimeMultiplier] = useState((settings.overtimeMultiplier ?? 1.5).toString());

  // Sync local state with props
  useEffect(() => {
    setHourlyRate(settings.hourlyRate.toString());
    setExchangeRate(settings.exchangeRate.toString());
    setDailyGoal(settings.dailyGoal.toString());
    setOvertimeMultiplier((settings.overtimeMultiplier ?? 1.5).toString());
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

  // Update overtime multiplier
  const handleOvertimeMultiplierChange = (value: string) => {
    setOvertimeMultiplier(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 1) {
      onUpdate({ overtimeMultiplier: num });
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

        {/* Overtime Multiplier */}
        <div className="space-y-2">
          <Label htmlFor="overtimeMultiplier" className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Overtime Multiplier
          </Label>
          <Input
            id="overtimeMultiplier"
            type="number"
            min="1"
            step="0.1"
            value={overtimeMultiplier}
            onChange={(e) => handleOvertimeMultiplierChange(e.target.value)}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">
            Overtime pay = hourly rate × {settings.overtimeMultiplier ?? 1.5}x
          </p>
        </div>

        {/* Show Shift Remaining Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Label htmlFor="showShiftRemaining" className="flex items-center gap-2 text-sm cursor-pointer">
            <Timer className="w-4 h-4 text-muted-foreground" />
            Show shift time remaining
          </Label>
          <Switch
            id="showShiftRemaining"
            checked={settings.showShiftRemaining ?? true}
            onCheckedChange={(checked) => onUpdate({ showShiftRemaining: checked })}
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
