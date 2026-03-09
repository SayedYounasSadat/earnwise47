import { memo, useState, useEffect } from "react";
import { Globe } from "lucide-react";

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
  const afgOffset = 4.5;

  const getTargetDate = (date: Date, offsetHours: number) => {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    return new Date(utc + offsetHours * 3600000);
  };

  const formatTime = (date: Date, offsetHours: number) => {
    return getTargetDate(date, offsetHours).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date, offsetHours: number) => {
    return getTargetDate(date, offsetHours).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Determine if it's daytime (6am-6pm)
  const isDaytime = (date: Date, offsetHours: number) => {
    const h = getTargetDate(date, offsetHours).getHours();
    return h >= 6 && h < 18;
  };

  const pacificDay = isDaytime(now, pacificOffset);
  const afgDay = isDaytime(now, afgOffset);

  // Time difference display
  const diffHours = afgOffset - pacificOffset;
  const diffH = Math.floor(diffHours);
  const diffM = (diffHours % 1) * 60;

  return (
    <div className="glass-card rounded-xl p-5 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">World Clock</h3>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          +{diffH}h {diffM > 0 ? `${diffM}m` : ""} apart
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 relative overflow-hidden">
          <span className="text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">{pacificLabel}</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatTime(now, pacificOffset)}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {formatDate(now, pacificOffset)}
          </span>
          <span className="absolute top-1.5 right-1.5 text-sm">{pacificDay ? "☀️" : "🌙"}</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 relative overflow-hidden">
          <span className="text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">AFT</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatTime(now, afgOffset)}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {formatDate(now, afgOffset)}
          </span>
          <span className="absolute top-1.5 right-1.5 text-sm">{afgDay ? "☀️" : "🌙"}</span>
        </div>
      </div>
    </div>
  );
});

WorldClockWidget.displayName = "WorldClockWidget";
