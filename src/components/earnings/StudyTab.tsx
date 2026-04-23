// Kauri-inspired Study tab — clean, minimal, focused.
import { useState, useMemo } from "react";
import { BookOpen, CalendarDays, Download, Plus } from "lucide-react";
import { useStudy } from "@/hooks/useStudy";
import { SubjectManager } from "./study/SubjectManager";
import { StudyTimer } from "./study/StudyTimer";
import { StudyStats } from "./study/StudyStats";
import { StudySessionLog } from "./study/StudySessionLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const StudyTab = () => {
  const { subjects, sessions, studyDays, addSubject, deleteSubject, addSession, deleteSession, updateStudyDays } = useStudy();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [manualMinutes, setManualMinutes] = useState("45");
  const [manualNotes, setManualNotes] = useState("");

  // Auto-select first subject if none selected
  const activeId = selectedSubjectId ?? subjects[0]?.id ?? null;

  const logManualSession = () => {
    if (!activeId) {
      toast.error("Add or select a subject first");
      return;
    }

    const minutes = Number(manualMinutes);
    if (!Number.isFinite(minutes) || minutes < 1) {
      toast.error("Enter at least 1 minute");
      return;
    }

    const start = new Date(`${manualDate}T12:00:00`).getTime();
    addSession({
      subjectId: activeId,
      startTime: start,
      endTime: start + minutes * 60_000,
      duration: Math.round(minutes * 60),
      date: manualDate,
      notes: manualNotes.trim() || undefined,
      source: "manual",
    });
    setManualNotes("");
    setManualOpen(false);
    toast.success("Study session added");
  };

  const exportStudyCsv = () => {
    const rows = [["Date", "Subject", "Minutes", "Source", "Notes"]];
    for (const session of sessions) {
      const subject = subjects.find((s) => s.id === session.subjectId);
      rows.push([
        session.date,
        subject?.name ?? "Unknown subject",
        String(Math.round(session.duration / 60)),
        session.source,
        session.notes ?? "",
      ]);
    }
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-sessions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <div className="flex flex-wrap justify-center gap-2 pt-3">
          <StudyDayPicker studyDays={studyDays} onChange={updateStudyDays} />
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Manual session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add study session</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select
                    value={activeId ?? ""}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Minutes</Label>
                    <Input type="number" min={1} value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} placeholder="Optional" className="min-h-[72px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setManualOpen(false)}>Cancel</Button>
                <Button onClick={logManualSession} disabled={!activeId}>Add session</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={exportStudyCsv} disabled={sessions.length === 0}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
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
      <StudyStats subjects={subjects} sessions={sessions} studyDays={studyDays} />

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

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const StudyDayPicker = ({ studyDays, onChange }: { studyDays: number[]; onChange: (days: number[]) => void }) => {
  const toggleDay = (day: number) => {
    const next = studyDays.includes(day)
      ? studyDays.filter((item) => item !== day)
      : [...studyDays, day];
    onChange(next.length > 0 ? next : studyDays);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" /> Study days
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Study schedule</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Choose the days that count toward your streak. Off-days are skipped automatically.</p>
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((day) => {
              const selected = studyDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`h-12 rounded-lg border text-xs font-medium transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
