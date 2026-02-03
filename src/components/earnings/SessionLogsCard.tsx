// Session logs with collapsible entries
import { memo, useState } from "react";
import { History, ChevronDown, ChevronUp, Clock, DollarSign, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkSession } from "@/types/earnings";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SessionLogsCardProps {
  sessions: WorkSession[];
  onClearLogs: () => void;
}

// Format duration to readable string
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

// Single log entry
const LogEntry = memo(({ session }: { session: WorkSession }) => {
  const [expanded, setExpanded] = useState(false);
  const startDate = new Date(session.startTime);
  const endDate = session.endTime ? new Date(session.endTime) : null;

  return (
    <div
      className={cn(
        "border border-border rounded-lg overflow-hidden transition-all duration-200",
        expanded ? "bg-muted/50" : "bg-card hover:bg-muted/30"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-success/10">
            <Clock className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">
              {startDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              {endDate && (
                <>
                  {" → "}
                  {endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-accent">${session.earnings.toFixed(2)}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Duration: {formatDuration(session.duration)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Earned: ${session.earnings.toFixed(4)}</span>
          </div>
          {session.notes && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{session.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

LogEntry.displayName = "LogEntry";

export const SessionLogsCard = memo(({ sessions, onClearLogs }: SessionLogsCardProps) => {
  // Sort sessions by start time, most recent first
  const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Session Logs</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {sessions.length}
          </span>
        </div>

        {sessions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Logs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {sessions.length} session logs. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No sessions yet</p>
          <p className="text-sm">Start working to see your logs here</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {sortedSessions.map((session) => (
              <LogEntry key={session.id} session={session} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
});

SessionLogsCard.displayName = "SessionLogsCard";
