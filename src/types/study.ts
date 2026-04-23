// Study Tab Type Definitions (Kauri-inspired)

export type SubjectColor =
  | "blue" | "green" | "purple" | "orange" | "pink" | "cyan" | "red" | "yellow";

export const SUBJECT_COLOR_HEX: Record<SubjectColor, string> = {
  blue: "#3b82f6",
  green: "#10b981",
  purple: "#8b5cf6",
  orange: "#f97316",
  pink: "#ec4899",
  cyan: "#06b6d4",
  red: "#ef4444",
  yellow: "#eab308",
};

export interface Subject {
  id: string;
  name: string;
  color: SubjectColor;
  goalHoursPerWeek?: number;
  createdAt: string; // ISO
}

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: number; // ms epoch
  endTime: number;   // ms epoch
  duration: number;  // seconds (focused time)
  date: string;      // YYYY-MM-DD
  notes?: string;
  source: "manual" | "pomodoro" | "stopwatch";
  pomodoroRounds?: number;
}

export interface StudyState {
  subjects: Subject[];
  sessions: StudySession[];
  studyDays: number[]; // 0 Sunday - 6 Saturday
}

export const DEFAULT_STUDY_STATE: StudyState = {
  subjects: [],
  sessions: [],
  studyDays: [1, 2, 3, 4, 5],
};
