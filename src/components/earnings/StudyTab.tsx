// Kauri-inspired Study tab — clean, minimal, focused.
import { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { useStudy } from "@/hooks/useStudy";
import { SubjectManager } from "./study/SubjectManager";
import { StudyTimer } from "./study/StudyTimer";
import { StudyStats } from "./study/StudyStats";
import { StudySessionLog } from "./study/StudySessionLog";

export const StudyTab = () => {
  const { subjects, sessions, addSubject, deleteSubject, addSession, deleteSession } = useStudy();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Auto-select first subject if none selected
  const activeId = selectedSubjectId ?? subjects[0]?.id ?? null;

  // Hours per subject this week, for the SubjectManager progress bars
  const weeklyHoursBySubject = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const map: Record<string, number> = {};
    for (const s of sessions) {
      if (new Date(s.date) >= weekStart) {
        map[s.subjectId] = (map[s.subjectId] ?? 0) + s.duration / 3600;
      }
    }
    return map;
  }, [sessions]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
          <BookOpen className="w-3.5 h-3.5" /> Study
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Focus on what matters
        </h2>
        <p className="text-sm text-muted-foreground">
          Track study time per subject. Stopwatch or Pomodoro — your choice.
        </p>
      </div>

      {/* Timer */}
      <StudyTimer
        subjects={subjects}
        selectedSubjectId={activeId}
        onSelectSubject={setSelectedSubjectId}
        onLogSession={addSession}
      />

      {/* Subjects */}
      <SubjectManager
        subjects={subjects}
        onAdd={addSubject}
        onDelete={deleteSubject}
        onSelect={setSelectedSubjectId}
        selectedId={activeId}
        weeklyHoursBySubject={weeklyHoursBySubject}
      />

      {/* Stats */}
      <StudyStats subjects={subjects} sessions={sessions} />

      {/* Session log */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Recent sessions
        </h3>
        <StudySessionLog subjects={subjects} sessions={sessions} onDelete={deleteSession} />
      </div>
    </div>
  );
};
