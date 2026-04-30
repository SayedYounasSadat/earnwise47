// Recent sessions preview — small QoL widget showing last few entries
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { History, ArrowRight, Clock } from "lucide-react";
import type { WorkSession } from "@/types/earnings";

interface RecentSessionsPreviewProps {
  sessions: WorkSession[];
  onViewAll: () => void;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatRelative = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
};

export const RecentSessionsPreview = memo(({ sessions, onViewAll }: RecentSessionsPreviewProps) => {
  const recent = useMemo(() => {
    return [...sessions]
      .filter((s) => s.endTime)
      .sort((a, b) => (b.endTime ?? 0) - (a.endTime ?? 0))
      .slice(0, 3);
  }, [sessions]);

  return (
    <div className="surface-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground inline-flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          Recent sessions
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          View all
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {recent.length === 0 ? (
        <div className="py-6 text-center">
          <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2 opacity-60" />
          <p className="text-sm text-muted-foreground">No sessions yet — start your first one above.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {recent.map((s) => (
            <li key={s.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {formatDuration(s.duration)}
                  {s.notes && (
                    <span className="ml-2 text-muted-foreground font-normal truncate">· {s.notes}</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {s.endTime ? formatRelative(s.endTime) : "in progress"}
                </p>
              </div>
              <span className="tabular-nums text-sm font-semibold text-accent shrink-0">
                ${s.earnings.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

RecentSessionsPreview.displayName = "RecentSessionsPreview";
