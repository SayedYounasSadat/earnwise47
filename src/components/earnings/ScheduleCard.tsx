// Work schedule management card with per-day goals
import { memo, useState } from "react";
import { Calendar, Clock, Bell, AlertTriangle, Target, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScheduleEntry } from "@/types/earnings";
import { cn } from "@/lib/utils";

interface ScheduleCardProps {
  schedule: ScheduleEntry[];
  onUpdate: (schedule: ScheduleEntry[]) => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Check if current time is within a scheduled shift
const isCurrentlyScheduled = (schedule: ScheduleEntry[]): boolean => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const todaySchedule = schedule.find((s) => s.dayOfWeek === currentDay && s.enabled);
  if (!todaySchedule) return false;

  return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
};

// Check for missed shifts today
const getMissedShift = (schedule: ScheduleEntry[], isWorking: boolean): string | null => {
  if (isWorking) return null;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const todaySchedule = schedule.find((s) => s.dayOfWeek === currentDay && s.enabled);
  if (!todaySchedule) return null;

  if (currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime) {
    return `Scheduled shift: ${todaySchedule.startTime} - ${todaySchedule.endTime}`;
  }

  return null;
};

export const ScheduleCard = memo(({ schedule, onUpdate }: ScheduleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isScheduled = isCurrentlyScheduled(schedule);
  const missedShift = getMissedShift(schedule, false);

  const handleToggleDay = (dayOfWeek: number) => {
    const newSchedule = schedule.map((s) =>
      s.dayOfWeek === dayOfWeek ? { ...s, enabled: !s.enabled } : s
    );
    onUpdate(newSchedule);
  };

  const handleTimeChange = (dayOfWeek: number, field: "startTime" | "endTime", value: string) => {
    const newSchedule = schedule.map((s) =>
      s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
    );
    onUpdate(newSchedule);
  };

  const handleGoalChange = (dayOfWeek: number, value: string) => {
    const goal = parseFloat(value) || 0;
    const newSchedule = schedule.map((s) =>
      s.dayOfWeek === dayOfWeek ? { ...s, dailyGoal: goal } : s
    );
    onUpdate(newSchedule);
  };

  // Calculate weekly goal
  const weeklyGoal = schedule
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + (s.dailyGoal || 0), 0);

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Work Schedule</h3>
        </div>

        {isScheduled && (
          <div className="flex items-center gap-1 text-success text-sm animate-pulse-soft">
            <Bell className="w-4 h-4" />
            <span>Shift Active</span>
          </div>
        )}
      </div>

      {/* Weekly goal summary */}
      <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-accent/10 border border-accent/20">
        <Target className="w-4 h-4 text-accent" />
        <span className="text-sm text-muted-foreground">Weekly Goal:</span>
        <span className="font-bold text-accent">${weeklyGoal.toFixed(0)}</span>
      </div>

      {/* Missed shift warning */}
      {missedShift && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">You should be working!</p>
            <p className="text-warning/80">{missedShift}</p>
          </div>
        </div>
      )}

      {/* Compact day view with goals */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {DAYS_SHORT.map((day, index) => {
          const daySchedule = schedule.find((s) => s.dayOfWeek === index);
          const isEnabled = daySchedule?.enabled || false;
          const goal = daySchedule?.dailyGoal || 0;

          return (
            <button
              key={day}
              onClick={() => handleToggleDay(index)}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded-md text-xs font-medium transition-colors",
                isEnabled
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>{day}</span>
              {isEnabled && (
                <span className="text-[10px] opacity-80 mt-0.5">${goal}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expand to edit times and goals */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-primary hover:underline w-full text-left"
      >
        {isExpanded ? "Hide Details" : "Edit Shift Times & Goals"}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {schedule.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex flex-col gap-3 p-3 rounded-lg transition-colors",
                entry.enabled ? "bg-muted/50" : "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={entry.enabled}
                  onCheckedChange={() => handleToggleDay(entry.dayOfWeek)}
                />
                <span className="w-24 text-sm font-medium">{DAYS[entry.dayOfWeek]}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pl-11">
                {/* Time inputs */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => handleTimeChange(entry.dayOfWeek, "startTime", e.target.value)}
                    className="w-24 h-8 text-sm"
                    disabled={!entry.enabled}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => handleTimeChange(entry.dayOfWeek, "endTime", e.target.value)}
                    className="w-24 h-8 text-sm"
                    disabled={!entry.enabled}
                  />
                </div>

                {/* Goal input */}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent" />
                  <Input
                    type="number"
                    value={entry.dailyGoal || ""}
                    onChange={(e) => handleGoalChange(entry.dayOfWeek, e.target.value)}
                    className="w-20 h-8 text-sm"
                    placeholder="Goal"
                    disabled={!entry.enabled}
                    min="0"
                    step="10"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ScheduleCard.displayName = "ScheduleCard";