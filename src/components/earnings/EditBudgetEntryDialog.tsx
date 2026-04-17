import { memo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BudgetExpense,
  BudgetIncome,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from "@/types/earnings";

type Mode = "expense" | "income";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  entry: BudgetExpense | BudgetIncome | null;
  onSave: (id: string, updates: any) => void;
}

export const EditBudgetEntryDialog = memo(({ open, onOpenChange, mode, entry, onSave }: Props) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("other");

  useEffect(() => {
    if (!entry) return;
    if (mode === "expense") {
      const e = entry as BudgetExpense;
      setName(e.name);
      setCategory(e.category);
    } else {
      const i = entry as BudgetIncome;
      setName(i.source);
    }
    setAmount(String(entry.amount));
    setDate(entry.date);
    setRecurring(entry.recurring);
  }, [entry, mode]);

  const handleSave = () => {
    if (!entry) return;
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    const base = { amount: amt, date, recurring };
    if (mode === "expense") {
      onSave(entry.id, { ...base, name: name.trim().slice(0, 100), category });
    } else {
      onSave(entry.id, { ...base, source: name.trim().slice(0, 100) });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {mode === "expense" ? "Expense" : "Income"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">{mode === "expense" ? "Name" : "Source"}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Amount ($)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {mode === "expense" && (
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
          )}
          <div className="flex items-center gap-2">
            <Switch checked={recurring} onCheckedChange={setRecurring} id="edit-recurring" />
            <Label htmlFor="edit-recurring" className="text-xs cursor-pointer">
              Recurring
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
EditBudgetEntryDialog.displayName = "EditBudgetEntryDialog";
