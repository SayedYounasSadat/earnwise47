// Recent study sessions list with delete
import { Trash2, Clock } from "lucide-react";
import { Subject, StudySession, SUBJECT_COLOR_HEX } from "@/types/study";
import { Button } from "@/components/ui/button";

interface Props {
  subjects: Subject[];
  sessions: StudySession[];
  onDelete: (id: string) => void;
}

export const StudySessionLog = ({ subjects, sessions, onDelete }: Props) => {
  const recent = sessions.slice(0, 20);

  if (recent.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border">
        <Clock className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No study sessions yet. Start the timer above to log your first one.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      {recent.map((s) => {
        const subject = subjects.find((sub) => sub.id === s.subjectId);
        const hex = subject ? SUBJECT_COLOR_HEX[subject.color] : "hsl(var(--muted))";
        const min = Math.round(s.duration / 60);
        const start = new Date(s.startTime);
        return (
          <div key={s.id} className="group flex items-center gap-3 p-3 sm:p-4">
            <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: hex }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground truncate">
                  {subject?.name ?? "Unknown subject"}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground tabular-nums">{min} min</span>
                {s.source === "pomodoro" && s.pomodoroRounds && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    🍅 {s.pomodoroRounds}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {start.toLocaleDateString("en", { month: "short", day: "numeric" })} ·{" "}
                {start.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}
                {s.notes && ` · ${s.notes}`}
              </p>
            </div>
            <Button
              variant="ghost" size="icon"
              className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(s.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};
