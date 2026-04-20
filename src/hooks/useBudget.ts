import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  BudgetState,
  BudgetExpense,
  BudgetIncome,
  SavingsGoal,
} from "@/types/earnings";
import { toast } from "sonner";

const STORAGE_KEY = "earnwise-budget";
const ALERT_KEY = "earnwise-budget-alerts";
const RECURRING_KEY = "earnwise-budget-recurring-month";

const generateId = () => Math.random().toString(36).slice(2, 10);
const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const loadBudget = (): BudgetState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { monthlyBudget: 0, expenses: [], incomes: [], savingsGoals: [] };
};

const saveBudget = (state: BudgetState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
};

interface UseBudgetOptions {
  /** Optional auto-synced earnings (e.g. from work sessions this month). */
  syncedEarnings?: { source: string; amount: number; date: string }[];
}

export const useBudget = (options: UseBudgetOptions = {}) => {
  const { syncedEarnings = [] } = options;
  const [state, setState] = useState<BudgetState>(loadBudget);

  const persist = useCallback((next: BudgetState) => {
    setState(next);
    saveBudget(next);
  }, []);

  // Monthly budget
  const setMonthlyBudget = useCallback((amount: number) => {
    persist({ ...state, monthlyBudget: amount });
    toast.success("Monthly budget updated");
  }, [state, persist]);

  // Expenses
  const addExpense = useCallback((data: Omit<BudgetExpense, "id">) => {
    const expense: BudgetExpense = { ...data, id: generateId() };
    persist({ ...state, expenses: [expense, ...state.expenses] });
    toast.success("Expense added");
  }, [state, persist]);

  const updateExpense = useCallback((id: string, updates: Partial<Omit<BudgetExpense, "id">>) => {
    persist({
      ...state,
      expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e),
    });
    toast.success("Expense updated");
  }, [state, persist]);

  const deleteExpense = useCallback((id: string) => {
    persist({ ...state, expenses: state.expenses.filter(e => e.id !== id) });
    toast.success("Expense deleted");
  }, [state, persist]);

  // Incomes
  const addIncome = useCallback((data: Omit<BudgetIncome, "id">) => {
    const income: BudgetIncome = { ...data, id: generateId() };
    persist({ ...state, incomes: [income, ...state.incomes] });
    toast.success("Income added");
  }, [state, persist]);

  const updateIncome = useCallback((id: string, updates: Partial<Omit<BudgetIncome, "id">>) => {
    persist({
      ...state,
      incomes: state.incomes.map(i => i.id === id ? { ...i, ...updates } : i),
    });
    toast.success("Income updated");
  }, [state, persist]);

  const deleteIncome = useCallback((id: string) => {
    persist({ ...state, incomes: state.incomes.filter(i => i.id !== id) });
    toast.success("Income deleted");
  }, [state, persist]);

  // Savings Goals
  const addSavingsGoal = useCallback((data: Omit<SavingsGoal, "id">) => {
    const goal: SavingsGoal = { ...data, id: generateId() };
    persist({ ...state, savingsGoals: [...state.savingsGoals, goal] });
    toast.success("Savings goal added");
  }, [state, persist]);

  const updateSavingsGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    persist({
      ...state,
      savingsGoals: state.savingsGoals.map(g => g.id === id ? { ...g, ...updates } : g),
    });
  }, [state, persist]);

  const deleteSavingsGoal = useCallback((id: string) => {
    persist({ ...state, savingsGoals: state.savingsGoals.filter(g => g.id !== id) });
    toast.success("Savings goal deleted");
  }, [state, persist]);

  // Computed stats for current month — merges manual + synced incomes
  const monthStats = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthExpenses = state.expenses.filter(e => e.date.startsWith(monthKey));

    // Build virtual incomes from synced earnings (read-only, prefixed id)
    const virtualIncomes: BudgetIncome[] = syncedEarnings
      .filter(e => e.date.startsWith(monthKey))
      .map((e, i) => ({
        id: `synced-${i}`,
        source: e.source,
        amount: e.amount,
        date: e.date,
        recurring: false,
      }));

    const manualMonthIncomes = state.incomes.filter(i => i.date.startsWith(monthKey));
    const monthIncomes = [...virtualIncomes, ...manualMonthIncomes];

    const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);
    const syncedIncomeTotal = virtualIncomes.reduce((s, i) => s + i.amount, 0);
    const remaining = state.monthlyBudget - totalExpenses;
    const byCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    return {
      totalExpenses,
      totalIncome,
      syncedIncomeTotal,
      remaining,
      byCategory,
      monthExpenses,
      monthIncomes,
    };
  }, [state, syncedEarnings]);

  // ── Auto-generate recurring expenses/incomes for the new month ──
  // Runs once per browser per month-key.
  useEffect(() => {
    const monthKey = currentMonthKey();
    let lastRun: string | null = null;
    try { lastRun = localStorage.getItem(RECURRING_KEY); } catch { /* ignore */ }
    if (lastRun === monthKey) return;

    const recurringExpenses = state.expenses.filter(e => e.recurring);
    const recurringIncomes = state.incomes.filter(i => i.recurring);
    if (recurringExpenses.length === 0 && recurringIncomes.length === 0) {
      try { localStorage.setItem(RECURRING_KEY, monthKey); } catch { /* ignore */ }
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const existingExpenseKeys = new Set(
      state.expenses
        .filter(e => e.date.startsWith(monthKey))
        .map(e => `${e.name}|${e.amount}|${e.category}`)
    );
    const existingIncomeKeys = new Set(
      state.incomes
        .filter(i => i.date.startsWith(monthKey))
        .map(i => `${i.source}|${i.amount}`)
    );

    const newExpenses: BudgetExpense[] = recurringExpenses
      .filter(e => !existingExpenseKeys.has(`${e.name}|${e.amount}|${e.category}`))
      .map(e => ({ ...e, id: generateId(), date: today }));

    const newIncomes: BudgetIncome[] = recurringIncomes
      .filter(i => !existingIncomeKeys.has(`${i.source}|${i.amount}`))
      .map(i => ({ ...i, id: generateId(), date: today }));

    if (newExpenses.length || newIncomes.length) {
      const next: BudgetState = {
        ...state,
        expenses: [...newExpenses, ...state.expenses],
        incomes: [...newIncomes, ...state.incomes],
      };
      setState(next);
      saveBudget(next);
      const total = newExpenses.length + newIncomes.length;
      toast.success(`Auto-added ${total} recurring entr${total === 1 ? "y" : "ies"} for this month`);
    }
    try { localStorage.setItem(RECURRING_KEY, monthKey); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Budget threshold alerts (80% / 100%) ──
  const lastAlertRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.monthlyBudget <= 0) return;
    const monthKey = currentMonthKey();
    const pct = (monthStats.totalExpenses / state.monthlyBudget) * 100;

    let fired: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(ALERT_KEY);
      if (raw) fired = JSON.parse(raw);
    } catch { /* ignore */ }
    const writeFired = (next: Record<string, string>) => {
      try { localStorage.setItem(ALERT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    };

    if (pct >= 100 && fired[`${monthKey}-100`] !== "1" && lastAlertRef.current !== `${monthKey}-100`) {
      toast.error("🚨 Monthly budget exceeded!", {
        description: `You're at ${pct.toFixed(0)}% of your $${state.monthlyBudget} budget.`,
      });
      lastAlertRef.current = `${monthKey}-100`;
      writeFired({ ...fired, [`${monthKey}-100`]: "1", [`${monthKey}-80`]: "1" });
    } else if (pct >= 80 && pct < 100 && fired[`${monthKey}-80`] !== "1" && lastAlertRef.current !== `${monthKey}-80`) {
      toast.warning("⚠️ 80% of monthly budget used", {
        description: `$${monthStats.remaining.toFixed(2)} remaining this month.`,
      });
      lastAlertRef.current = `${monthKey}-80`;
      writeFired({ ...fired, [`${monthKey}-80`]: "1" });
    }
  }, [monthStats.totalExpenses, monthStats.remaining, state.monthlyBudget]);

  return {
    ...state,
    monthStats,
    setMonthlyBudget,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
  };
};
