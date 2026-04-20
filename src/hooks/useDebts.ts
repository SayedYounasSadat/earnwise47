import { useState, useCallback } from "react";
import { Debt } from "@/types/earnings";
import { toast } from "sonner";

const STORAGE_KEY = "earnwise-debts";
const generateId = () => Math.random().toString(36).slice(2, 10);

const load = (): Debt[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
};

const save = (debts: Debt[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(debts)); } catch { /* ignore */ }
};

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>(load);

  const persist = useCallback((next: Debt[]) => {
    setDebts(next);
    save(next);
  }, []);

  const addDebt = useCallback((data: Omit<Debt, "id" | "createdAt">) => {
    const debt: Debt = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist([debt, ...debts]);
    toast.success("Debt added");
  }, [debts, persist]);

  const updateDebt = useCallback((id: string, updates: Partial<Omit<Debt, "id">>) => {
    persist(debts.map(d => d.id === id ? { ...d, ...updates } : d));
  }, [debts, persist]);

  const recordPayment = useCallback((id: string, amount: number) => {
    if (amount <= 0) return;
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    const newBalance = Math.max(0, debt.currentBalance - amount);
    persist(debts.map(d => d.id === id ? { ...d, currentBalance: newBalance } : d));
    if (newBalance === 0) {
      toast.success(`🎉 ${debt.name} paid off!`);
    } else {
      toast.success(`Payment of $${amount.toFixed(2)} recorded`);
    }
  }, [debts, persist]);

  const deleteDebt = useCallback((id: string) => {
    persist(debts.filter(d => d.id !== id));
    toast.success("Debt removed");
  }, [debts, persist]);

  return { debts, addDebt, updateDebt, recordPayment, deleteDebt };
};
