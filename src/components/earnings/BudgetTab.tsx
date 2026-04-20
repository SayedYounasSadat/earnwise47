import { memo, useState, useMemo } from "react";
import {
  Wallet,
  PlusCircle,
  Trash2,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Zap,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  BudgetExpense,
  BudgetIncome,
  SavingsGoal,
  WorkSession,
} from "@/types/earnings";
import { useBudget } from "@/hooks/useBudget";
import { format } from "date-fns";
import { CategoryPieChart } from "./CategoryPieChart";
import { BudgetInsights } from "./BudgetInsights";
import { EditBudgetEntryDialog } from "./EditBudgetEntryDialog";
import { MonthlyTrendsChart } from "./MonthlyTrendsChart";
import { UpcomingBillsCard } from "./UpcomingBillsCard";
import { YearOverYearCard } from "./YearOverYearCard";
import { DebtTrackerCard } from "./DebtTrackerCard";

interface BudgetTabProps {
  /** Optional work sessions used to auto-sync earnings as income. */
  sessions?: WorkSession[];
}

// ─── Small reusable KPI card ─────────────────────
const KpiCard = memo(
  ({
    icon,
    label,
    value,
    sub,
    accent,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent?: string;
  }) => (
    <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <p className={`text-xl font-bold tabular-nums ${accent ?? "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
);
KpiCard.displayName = "KpiCard";

// ─── Add Expense Form ─────────────────────
const AddExpenseForm = memo(({ onAdd }: { onAdd: (e: Omit<BudgetExpense, "id">) => void }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [recurring, setRecurring] = useState(false);

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    onAdd({
      name: name.trim().slice(0, 100),
      amount: amt,
      category,
      date: format(new Date(), "yyyy-MM-dd"),
      recurring,
    });
    setName("");
    setAmount("");
    setRecurring(false);
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
        <PlusCircle className="w-4 h-4 text-destructive" />
        Add Expense
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent"
            maxLength={100}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Amount ($)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <Switch checked={recurring} onCheckedChange={setRecurring} id="recurring-expense" />
          <Label htmlFor="recurring-expense" className="text-xs cursor-pointer">
            Recurring
          </Label>
        </div>
      </div>
      <Button onClick={handleSubmit} size="sm" className="w-full">
        Add Expense
      </Button>
    </div>
  );
});
AddExpenseForm.displayName = "AddExpenseForm";

// ─── Add Income Form ─────────────────────
const AddIncomeForm = memo(({ onAdd }: { onAdd: (i: Omit<BudgetIncome, "id">) => void }) => {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!source.trim() || isNaN(amt) || amt <= 0) return;
    onAdd({
      source: source.trim().slice(0, 100),
      amount: amt,
      date: format(new Date(), "yyyy-MM-dd"),
      recurring,
    });
    setSource("");
    setAmount("");
    setRecurring(false);
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
        <PlusCircle className="w-4 h-4 text-accent" />
        Add Income
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Source</Label>
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Freelance"
            maxLength={100}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Amount ($)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={recurring} onCheckedChange={setRecurring} id="recurring-income" />
        <Label htmlFor="recurring-income" className="text-xs cursor-pointer">
          Recurring monthly
        </Label>
      </div>
      <Button onClick={handleSubmit} size="sm" variant="outline" className="w-full">
        Add Income
      </Button>
    </div>
  );
});
AddIncomeForm.displayName = "AddIncomeForm";

// ─── Savings Goal Card ─────────────────────
const SavingsGoalCard = memo(
  ({
    goal,
    onUpdate,
    onDelete,
  }: {
    goal: SavingsGoal;
    onUpdate: (id: string, updates: Partial<SavingsGoal>) => void;
    onDelete: (id: string) => void;
  }) => {
    const [addAmount, setAddAmount] = useState("");
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

    const handleAdd = () => {
      const amt = parseFloat(addAmount);
      if (isNaN(amt) || amt <= 0) return;
      onUpdate(goal.id, { currentAmount: goal.currentAmount + amt });
      setAddAmount("");
    };

    return (
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">{goal.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(goal.id)}>
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${goal.currentAmount.toFixed(2)}</span>
            <span>${goal.targetAmount.toFixed(2)}</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2.5" />
          <p className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}% complete</p>
        </div>
        {goal.deadline && (
          <p className="text-xs text-muted-foreground">
            Deadline: {format(new Date(goal.deadline + "T00:00:00"), "MMM d, yyyy")}
          </p>
        )}
        <div className="flex gap-2">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="Add funds"
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleAdd} className="h-8 shrink-0">
            + Add
          </Button>
        </div>
      </div>
    );
  }
);
SavingsGoalCard.displayName = "SavingsGoalCard";

// ─── Add Savings Goal Form ─────────────────────
const AddSavingsGoalForm = memo(
  ({ onAdd }: { onAdd: (g: Omit<SavingsGoal, "id">) => void }) => {
    const [name, setName] = useState("");
    const [target, setTarget] = useState("");
    const [deadline, setDeadline] = useState("");

    const handleSubmit = () => {
      const amt = parseFloat(target);
      if (!name.trim() || isNaN(amt) || amt <= 0) return;
      onAdd({
        name: name.trim().slice(0, 100),
        targetAmount: amt,
        currentAmount: 0,
        deadline: deadline || undefined,
      });
      setName("");
      setTarget("");
      setDeadline("");
    };

    return (
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          New Savings Goal
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Goal Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund"
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Target ($)</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="1000"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Deadline (optional)</Label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <Button onClick={handleSubmit} size="sm" variant="outline" className="w-full">
          Create Goal
        </Button>
      </div>
    );
  }
);
AddSavingsGoalForm.displayName = "AddSavingsGoalForm";

// ─── Main Budget Tab ─────────────────────
export const BudgetTab = memo(({ sessions = [] }: BudgetTabProps) => {
  // Build synced earnings from work sessions for the current month
  const syncedEarnings = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return sessions
      .filter((s) => s.date.startsWith(monthKey) && s.earnings > 0)
      .map((s) => ({
        source: s.project ? `Work: ${s.project}` : "Work Session",
        amount: s.earnings,
        date: s.date,
      }));
  }, [sessions]);

  const {
    monthlyBudget,
    expenses,
    incomes,
    savingsGoals,
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
  } = useBudget({ syncedEarnings });

  const [budgetInput, setBudgetInput] = useState(monthlyBudget > 0 ? monthlyBudget.toString() : "");

  // Edit dialog state
  const [editMode, setEditMode] = useState<"expense" | "income">("expense");
  const [editEntry, setEditEntry] = useState<BudgetExpense | BudgetIncome | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openEdit = (mode: "expense" | "income", entry: BudgetExpense | BudgetIncome) => {
    setEditMode(mode);
    setEditEntry(entry);
    setEditOpen(true);
  };

  const handleEditSave = (id: string, updates: any) => {
    if (editMode === "expense") updateExpense(id, updates);
    else updateIncome(id, updates);
  };

  const handleBudgetSet = () => {
    const amt = parseFloat(budgetInput);
    if (!isNaN(amt) && amt >= 0) setMonthlyBudget(amt);
  };

  const categoryBreakdown = useMemo(() => {
    return Object.entries(monthStats.byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => ({
        category: cat as ExpenseCategory,
        amount,
        pct: monthStats.totalExpenses > 0 ? (amount / monthStats.totalExpenses) * 100 : 0,
      }));
  }, [monthStats]);

  const topCategory = categoryBreakdown[0]
    ? { category: categoryBreakdown[0].category, amount: categoryBreakdown[0].amount }
    : null;

  const netFlow = monthStats.totalIncome - monthStats.totalExpenses;
  const budgetUsedPct = monthlyBudget > 0 ? (monthStats.totalExpenses / monthlyBudget) * 100 : 0;

  const handleExportCSV = () => {
    const escape = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows: string[] = ["Type,Date,Name/Source,Category,Amount,Recurring"];
    expenses.forEach((e) =>
      rows.push(["Expense", e.date, e.name, e.category, e.amount.toFixed(2), e.recurring ? "Yes" : "No"].map(escape).join(","))
    );
    incomes.forEach((i) =>
      rows.push(["Income", i.date, i.source, "", i.amount.toFixed(2), i.recurring ? "Yes" : "No"].map(escape).join(","))
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Monthly Budget"
          value={monthlyBudget > 0 ? `$${monthlyBudget.toFixed(0)}` : "Not set"}
        />
        <KpiCard
          icon={<ArrowDownRight className="w-3.5 h-3.5" />}
          label="Expenses"
          value={`$${monthStats.totalExpenses.toFixed(2)}`}
          accent="text-destructive"
          sub={monthlyBudget > 0 ? `${budgetUsedPct.toFixed(0)}% of budget` : undefined}
        />
        <KpiCard
          icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          label="Income"
          value={`$${monthStats.totalIncome.toFixed(2)}`}
          accent="text-accent"
          sub={
            monthStats.syncedIncomeTotal > 0
              ? `+$${monthStats.syncedIncomeTotal.toFixed(0)} from work`
              : undefined
          }
        />
        <KpiCard
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Net Flow"
          value={`${netFlow >= 0 ? "+" : ""}$${netFlow.toFixed(2)}`}
          accent={netFlow >= 0 ? "text-accent" : "text-destructive"}
        />
      </div>

      {/* Budget bar */}
      {monthlyBudget > 0 && (
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Budget Used</span>
            <span className="font-bold text-foreground tabular-nums">
              ${monthStats.totalExpenses.toFixed(2)} / ${monthlyBudget.toFixed(2)}
            </span>
          </div>
          <Progress
            value={Math.min(budgetUsedPct, 100)}
            className={`h-3 ${budgetUsedPct > 90 ? "[&>div]:bg-destructive" : budgetUsedPct > 70 ? "[&>div]:bg-yellow-500" : ""}`}
          />
          <p className="text-xs text-muted-foreground">
            {monthStats.remaining >= 0
              ? `$${monthStats.remaining.toFixed(2)} remaining this month`
              : `$${Math.abs(monthStats.remaining).toFixed(2)} over budget!`}
          </p>
        </div>
      )}

      {/* Pie chart + insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <CategoryPieChart data={categoryBreakdown} total={monthStats.totalExpenses} />
        <BudgetInsights
          totalIncome={monthStats.totalIncome}
          totalExpenses={monthStats.totalExpenses}
          monthlyBudget={monthlyBudget}
          topCategory={topCategory}
        />
      </div>

      {/* 6-month trends */}
      <MonthlyTrendsChart expenses={expenses} incomes={incomes} sessions={sessions} />

      {/* Bills + YoY */}
      <div className="grid gap-4 md:grid-cols-2">
        <UpcomingBillsCard expenses={expenses} />
        <YearOverYearCard expenses={expenses} incomes={incomes} sessions={sessions} />
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={expenses.length === 0 && incomes.length === 0}>
          <Download className="w-3.5 h-3.5 mr-2" />
          Export Budget CSV
        </Button>
      </div>

      {/* Set budget */}
      <div className="glass-card rounded-xl p-4">
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-primary" />
          Set Monthly Budget
        </h4>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            step="50"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="e.g. 2000"
            className="max-w-[200px]"
          />
          <Button size="sm" onClick={handleBudgetSet}>
            Set
          </Button>
        </div>
      </div>

      {/* Sub-tabs: Expenses / Income / Savings */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="expenses" className="text-xs sm:text-sm">
            <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="income" className="text-xs sm:text-sm">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Income
          </TabsTrigger>
          <TabsTrigger value="savings" className="text-xs sm:text-sm">
            <PiggyBank className="w-3.5 h-3.5 mr-1.5" />
            Savings
          </TabsTrigger>
        </TabsList>

        {/* Expenses Sub-tab */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <AddExpenseForm onAdd={addExpense} />

          {/* Category breakdown bars */}
          {categoryBreakdown.length > 0 && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-sm">Spending by Category</h4>
              <div className="space-y-2">
                {categoryBreakdown.map(({ category, amount, pct }) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {EXPENSE_CATEGORY_LABELS[category]}
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        ${amount.toFixed(2)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense list */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="font-semibold text-foreground text-sm mb-3">Recent Expenses</h4>
            {monthStats.monthExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No expenses this month. Add one above!
              </p>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {monthStats.monthExpenses
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {expense.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {EXPENSE_CATEGORY_LABELS[expense.category]}
                            </Badge>
                            <span>{expense.date}</span>
                            {expense.recurring && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Recurring
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-bold text-destructive tabular-nums text-sm">
                            -${expense.amount.toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openEdit("expense", expense)}
                            aria-label="Edit expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteExpense(expense.id)}
                            aria-label="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        {/* Income Sub-tab */}
        <TabsContent value="income" className="space-y-4 mt-4">
          <AddIncomeForm onAdd={addIncome} />

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground text-sm">Recent Income</h4>
              {monthStats.syncedIncomeTotal > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Zap className="w-3 h-3" />
                  Auto-synced from work
                </Badge>
              )}
            </div>
            {monthStats.monthIncomes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No income recorded this month.
              </p>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {monthStats.monthIncomes
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((income) => {
                      const isSynced = income.id.startsWith("synced-");
                      return (
                        <div
                          key={income.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg group ${
                            isSynced ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                              {isSynced && <Zap className="w-3 h-3 text-primary shrink-0" />}
                              {income.source}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{income.date}</span>
                              {income.recurring && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  Recurring
                                </Badge>
                              )}
                              {isSynced && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  Auto
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-bold text-accent tabular-nums text-sm">
                              +${income.amount.toFixed(2)}
                            </span>
                            {!isSynced && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => openEdit("income", income)}
                                  aria-label="Edit income"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => deleteIncome(income.id)}
                                  aria-label="Delete income"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        {/* Savings Sub-tab */}
        <TabsContent value="savings" className="space-y-4 mt-4">
          <AddSavingsGoalForm onAdd={addSavingsGoal} />

          {savingsGoals.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <PiggyBank className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No savings goals yet. Create one to start tracking!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {savingsGoals.map((goal) => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={updateSavingsGoal}
                  onDelete={deleteSavingsGoal}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EditBudgetEntryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode={editMode}
        entry={editEntry}
        onSave={handleEditSave}
      />
    </div>
  );
});

BudgetTab.displayName = "BudgetTab";
