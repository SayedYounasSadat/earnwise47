// Earnings Tracker Type Definitions

export interface WorkSession {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
  earnings: number; // in USD
  notes: string;
  date: string; // YYYY-MM-DD format
}

export interface DailyLog {
  date: string;
  sessions: WorkSession[];
  totalDuration: number;
  totalEarnings: number;
  loginTime: number | null;
  logoutTime: number | null;
}

export interface ScheduleEntry {
  id: string;
  dayOfWeek: number; // 0-6, Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  enabled: boolean;
}

export interface Settings {
  hourlyRate: number;
  exchangeRate: number; // 1 USD = X AFN
  currencyCode: string;
  dailyGoal: number; // in USD
  darkMode: boolean;
  notifications: boolean;
}

export interface AppState {
  isWorking: boolean;
  currentSessionStart: number | null;
  currentSessionDuration: number;
  totalEarningsToday: number;
  sessions: WorkSession[];
  dailyLogs: DailyLog[];
  schedule: ScheduleEntry[];
  settings: Settings;
  lastMilestone: number;
  loginTime: number | null;
}

export interface ChartDataPoint {
  date: string;
  earnings: number;
  hours: number;
  label: string;
}

export const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 15,
  exchangeRate: 70, // 1 USD = 70 AFN
  currencyCode: "AFN",
  dailyGoal: 100,
  darkMode: false,
  notifications: true,
};

export const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  { id: "1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true },
  { id: "2", dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true },
  { id: "3", dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true },
  { id: "4", dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true },
  { id: "5", dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true },
  { id: "6", dayOfWeek: 6, startTime: "09:00", endTime: "13:00", enabled: false },
  { id: "0", dayOfWeek: 0, startTime: "09:00", endTime: "13:00", enabled: false },
];
