// Earnings Tracker Type Definitions

export type BreakType = "lunch" | "short" | "rr" | "custom";

export interface BreakSession {
  id: string;
  type: BreakType;
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
  date: string;
}

export interface WorkSession {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
  earnings: number; // in USD
  notes: string;
  date: string; // YYYY-MM-DD format
  breaks: BreakSession[]; // breaks taken during this session
  project?: string; // optional project/client tag
}

export interface DailyBreakUsage {
  lunchUsed: boolean; // 1x 30-min
  shortBreaksUsed: number; // max 2x 15-min
  rrBreaksUsed: number; // max 2x, no fixed duration
}

export interface DailyLog {
  date: string;
  sessions: WorkSession[];
  totalDuration: number;
  totalEarnings: number;
  loginTime: number | null;
  logoutTime: number | null;
  breakUsage: DailyBreakUsage;
}

export interface ScheduleEntry {
  id: string;
  dayOfWeek: number; // 0-6, Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  enabled: boolean;
  dailyGoal: number; // Individual daily goal in USD
}

export interface Settings {
  hourlyRate: number;
  exchangeRate: number; // 1 USD = X AFN
  currencyCode: string;
  dailyGoal: number; // Default daily goal in USD
  darkMode: boolean;
  notifications: boolean;
  overtimeMultiplier: number; // e.g. 1.5x for overtime pay
  showShiftRemaining: boolean; // show remaining shift time on timer
  usePacificDST: boolean; // true = PDT (summer), false = PST (winter)
  confirmReset: boolean; // show confirmation dialog before resetting timer
  confirmStop: boolean; // show confirmation dialog before stopping session
  autoSaveBeforeReset: boolean; // snapshot session to localStorage before reset for undo
}

export interface AppState {
  isWorking: boolean;
  isPaused: boolean;
  isOnBreak: boolean;
  currentBreakType: BreakType | null;
  currentBreakStart: number | null;
  currentSessionBreaks: BreakSession[];
  currentSessionStart: number | null;
  currentSessionDuration: number;
  accumulatedDuration: number; // Duration accumulated before pause
  totalEarningsToday: number;
  sessions: WorkSession[];
  dailyLogs: DailyLog[];
  schedule: ScheduleEntry[];
  settings: Settings;
  lastMilestone: number;
  loginTime: number | null;
  dailyBreakUsage: DailyBreakUsage;
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
  overtimeMultiplier: 1.5,
  showShiftRemaining: true,
  usePacificDST: true, // Default to PDT (March-November)
  confirmReset: true,
  confirmStop: true,
  autoSaveBeforeReset: true,
};

export const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  { id: "1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true, dailyGoal: 100 },
  { id: "2", dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true, dailyGoal: 100 },
  { id: "3", dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true, dailyGoal: 100 },
  { id: "4", dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true, dailyGoal: 100 },
  { id: "5", dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true, dailyGoal: 100 },
  { id: "6", dayOfWeek: 6, startTime: "09:00", endTime: "13:00", enabled: false, dailyGoal: 50 },
  { id: "0", dayOfWeek: 0, startTime: "09:00", endTime: "13:00", enabled: false, dailyGoal: 50 },
];

export const DEFAULT_BREAK_USAGE: DailyBreakUsage = {
  lunchUsed: false,
  shortBreaksUsed: 0,
  rrBreaksUsed: 0,
};

export const BREAK_DURATIONS = {
  lunch: 30 * 60, // 30 minutes in seconds
  short: 15 * 60, // 15 minutes in seconds
} as const;

// ─── Budgeting Types ─────────────────────────────────

export type ExpenseCategory =
  | "housing"
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "health"
  | "education"
  | "shopping"
  | "subscriptions"
  | "other";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: "Housing & Rent",
  food: "Food & Groceries",
  transport: "Transport",
  utilities: "Utilities & Bills",
  entertainment: "Entertainment",
  health: "Health & Fitness",
  education: "Education",
  shopping: "Shopping",
  subscriptions: "Subscriptions",
  other: "Other",
};

export interface BudgetExpense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  recurring: boolean;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  color?: string;
}

export interface BudgetIncome {
  id: string;
  source: string;
  amount: number;
  date: string; // YYYY-MM-DD
  recurring: boolean;
}

export interface BudgetState {
  monthlyBudget: number;
  expenses: BudgetExpense[];
  incomes: BudgetIncome[];
  savingsGoals: SavingsGoal[];
}

// ─── Debt Tracking ────────────────────────────
export type DebtType = "credit_card" | "loan" | "mortgage" | "student" | "personal" | "other";

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  credit_card: "Credit Card",
  loan: "Loan",
  mortgage: "Mortgage",
  student: "Student Loan",
  personal: "Personal Debt",
  other: "Other",
};

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  originalBalance: number;
  currentBalance: number;
  interestRate: number; // annual %, e.g. 18.5
  minimumPayment: number;
  createdAt: string; // YYYY-MM-DD
}
