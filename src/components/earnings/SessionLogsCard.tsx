import { memo, useState, useMemo } from "react";
import { History, ChevronDown, ChevronUp, Clock, DollarSign, FileText, Trash2, Coffee, UtensilsCrossed, Pencil, Plus, Tag, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WorkSession, BreakSession } from "@/types/earnings";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SessionFormDialog } from "./SessionFormDialog";

interface SessionLogsCardProps {
  sessions: WorkSession[];
  onClearLogs: () => void;
  onDeleteSession?: (id: string) => void;
  onUpdateSession?: (id: string, updates: Partial<Pick<WorkSession, 'startTime' | 'endTime' | 'notes' | 'project' | 'date'>>) => void;
  onAddManualSession?: (data: { date: string; startTime: number; endTime: number; notes: string; project: string }) => void;
  hourlyRate?: number;
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const BreakEntry = memo(({ breakSession }: { breakSession: BreakSession }) => {
  const isLunch = breakSession.type === "lunch";
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-warning/5 border border-warning/10">
      {isLunch ? <UtensilsCrossed className="w-3 h-3 text-warning" /> : <Coffee className="w-3 h-3 text-primary" />}
      <span className="text-xs text-muted-foreground">
        {isLunch ? "Lunch" : "Short"} break: {formatDuration(breakSession.duration)}
      </span>
      <span className="text-xs text-muted-foreground/70 ml-auto">
        {new Date(breakSession.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
});
BreakEntry.displayName = "BreakEntry";

const LogEntry = memo(({ session, onDelete, onEdit }: { session: WorkSession; onDelete?: (id: string) => void; onEdit?: (session: WorkSession) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const startDate = new Date(session.startTime);
  const endDate = session.endTime ? new Date(session.endTime) : null;
  const breakCount = session.breaks?.length || 0;
  const totalBreakTime = session.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden transition-all duration-200", expanded ? "bg-muted/50" : "bg-card hover:bg-muted/30")}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 text-left">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-success/10">
            <Clock className="w-4 h-4 text-success" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-foreground">
                {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              {session.project && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  <Tag className="w-2.5 h-2.5 mr-1" />
                  {session.project}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              {endDate && <>{" → "}{endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</>}
              {breakCount > 0 && <span className="ml-2 text-warning">• {breakCount} break{breakCount > 1 ? 's' : ''}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-accent">${session.earnings.toFixed(2)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /><span>Work Time: {formatDuration(session.duration)}</span>
          </div>
          {totalBreakTime > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coffee className="w-3.5 h-3.5" /><span>Break Time: {formatDuration(totalBreakTime)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" /><span>Earned: ${session.earnings.toFixed(4)}</span>
          </div>
          {session.breaks && session.breaks.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Breaks taken:</p>
              {session.breaks.map((b) => <BreakEntry key={b.id} breakSession={b} />)}
            </div>
          )}
          {session.notes && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{session.notes}</span>
            </div>
          )}

          {/* Edit / Delete actions */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(session)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this session?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently remove this session log.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(session.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
LogEntry.displayName = "LogEntry";

export const SessionLogsCard = memo(({ sessions, onClearLogs, onDeleteSession, onUpdateSession, onAddManualSession, hourlyRate = 15 }: SessionLogsCardProps) => {
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const existingProjects = useMemo(() => {
    const projects = sessions.map((s) => s.project).filter(Boolean) as string[];
    return [...new Set(projects)];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.startTime - a.startTime);
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter(s => 
      s.notes?.toLowerCase().includes(q) ||
      s.project?.toLowerCase().includes(q) ||
      s.date?.includes(q) ||
      new Date(s.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  const handleEditSave = (data: { date: string; startTime: number; endTime: number; notes: string; project: string }) => {
    if (editingSession && onUpdateSession) {
      onUpdateSession(editingSession.id, {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        project: data.project || undefined,
      });
    }
    setEditingSession(null);
  };

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Session Logs</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{sessions.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {onAddManualSession && (
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Session
            </Button>
          )}
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
                  <AlertDialogDescription>This will permanently delete all {sessions.length} session logs.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Search bar */}
      {sessions.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by date, project, or notes..."
            className="pl-9 bg-background h-9 text-sm"
          />
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No sessions yet</p>
          <p className="text-sm">Start working to see your logs here</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No sessions match "{searchQuery}"</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <LogEntry
                key={session.id}
                session={session}
                onDelete={onDeleteSession}
                onEdit={onUpdateSession ? setEditingSession : undefined}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Edit dialog */}
      <SessionFormDialog
        open={!!editingSession}
        onOpenChange={(open) => { if (!open) setEditingSession(null); }}
        mode="edit"
        session={editingSession || undefined}
        hourlyRate={hourlyRate}
        existingProjects={existingProjects}
        onSave={handleEditSave}
      />

      {/* Add dialog */}
      {onAddManualSession && (
        <SessionFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          mode="add"
          hourlyRate={hourlyRate}
          existingProjects={existingProjects}
          onSave={(data) => { onAddManualSession(data); }}
        />
      )}
    </div>
  );
});
SessionLogsCard.displayName = "SessionLogsCard";
