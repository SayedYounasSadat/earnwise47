// Study tab state hook (localStorage-first, mirrors useBudget pattern)
import { useState, useCallback } from "react";
import {
  StudyState,
  Subject,
  StudySession,
  DEFAULT_STUDY_STATE,
  SubjectColor,
} from "@/types/study";
import { toast } from "sonner";

const STORAGE_KEY = "earnwise-study";
const genId = () => Math.random().toString(36).slice(2, 10);

const load = (): StudyState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STUDY_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_STUDY_STATE;
};

const save = (s: StudyState) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

export const useStudy = () => {
  const [state, setState] = useState<StudyState>(load);

  const persist = useCallback((next: StudyState) => {
    setState(next);
    save(next);
  }, []);

  const addSubject = useCallback(
    (name: string, color: SubjectColor, goalHoursPerWeek?: number) => {
      const subject: Subject = {
        id: genId(),
        name: name.trim(),
        color,
        goalHoursPerWeek,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => {
        const next = { ...prev, subjects: [...prev.subjects, subject] };
        save(next);
        return next;
      });
      toast.success(`Subject "${subject.name}" added`);
      return subject;
    },
    []
  );

  const updateSubject = useCallback((id: string, patch: Partial<Subject>) => {
    setState((prev) => {
      const next = {
        ...prev,
        subjects: prev.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      };
      save(next);
      return next;
    });
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== id),
        sessions: prev.sessions.filter((s) => s.subjectId !== id),
      };
      save(next);
      return next;
    });
    toast.success("Subject removed");
  }, []);

  const addSession = useCallback((data: Omit<StudySession, "id">) => {
    const session: StudySession = { ...data, id: genId() };
    setState((prev) => {
      const next = { ...prev, sessions: [session, ...prev.sessions] };
      save(next);
      return next;
    });
    return session;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, sessions: prev.sessions.filter((s) => s.id !== id) };
      save(next);
      return next;
    });
    toast.success("Session deleted");
  }, []);

  const updateStudyDays = useCallback((studyDays: number[]) => {
    setState((prev) => {
      const next = { ...prev, studyDays: [...studyDays].sort((a, b) => a - b) };
      save(next);
      return next;
    });
    toast.success("Study schedule updated");
  }, []);

  return {
    subjects: state.subjects,
    sessions: state.sessions,
    studyDays: state.studyDays,
    addSubject,
    updateSubject,
    deleteSubject,
    addSession,
    deleteSession,
    updateStudyDays,
    persist,
  };
};
