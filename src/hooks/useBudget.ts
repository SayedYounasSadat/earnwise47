import { useState, useCallback, useMemo } from "react";
import {
  BudgetState,
  BudgetExpense,
  BudgetIncome,
  SavingsGoal,
} from "@/types/earnings";
import { toast } from "sonner";

const STORAGE_KEY = "earnwise-budget";

const generateId = () => Math.random().toString(36).slice(2, 10);

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

export const useBudget = () => {
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

  // Computed stats for current month
  const monthStats = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthExpenses = state.expenses.filter(e => e.date.startsWith(monthKey));
    const monthIncomes = state.incomes.filter(i => i.date.startsWith(monthKey));
    const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);
    const remaining = state.monthlyBudget - totalExpenses;
    const byCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    return { totalExpenses, totalIncome, remaining, byCategory, monthExpenses, monthIncomes };
  }, [state]);

  return {
    ...state,
    monthStats,
    setMonthlyBudget,
    addExpense,
    deleteExpense,
    addIncome,
    deleteIncome,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
  };
};
