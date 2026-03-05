import { memo, useState, useEffect } from "react";
import { Globe, Clock } from "lucide-react";

interface WorldClockWidgetProps {
  useDST: boolean;
}

export const WorldClockWidget = memo(({ useDST }: WorldClockWidgetProps) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pacificOffset = useDST ? -7 : -8;
  const pacificLabel = useDST ? "PDT" : "PST";
  const afgOffset = 4.5; // UTC+4:30

  const formatTime = (date: Date, offsetHours: number) => {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const target = new Date(utc + offsetHours * 3600000);
    return target.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date, offsetHours: number) => {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const target = new Date(utc + offsetHours * 3600000);
    return target.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="glass-card rounded-xl p-5 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">World Clock</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
          <span className="text-xs font-medium text-muted-foreground mb-1">{pacificLabel}</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatTime(now, pacificOffset)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {formatDate(now, pacificOffset)}
          </span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
          <span className="text-xs font-medium text-muted-foreground mb-1">AFT (UTC+4:30)</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatTime(now, afgOffset)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {formatDate(now, afgOffset)}
          </span>
        </div>
      </div>
    </div>
  );
});

WorldClockWidget.displayName = "WorldClockWidget";
