import { memo, useMemo, useState } from "react";
import { CreditCard, Plus, Trash2, DollarSign, TrendingDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDebts } from "@/hooks/useDebts";
import { Debt, DebtType, DEBT_TYPE_LABELS } from "@/types/earnings";

/**
 * Estimate months to payoff with fixed monthly payment, given annual interest rate.
 * Returns null if payment doesn't cover monthly interest (never pays off).
 */
const monthsToPayoff = (balance: number, monthlyPayment: number, annualRate: number): number | null => {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return null;
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(balance / monthlyPayment);
  const monthlyInterest = balance * r;
  if (monthlyPayment <= monthlyInterest) return null;
  return Math.ceil(Math.log(monthlyPayment / (monthlyPayment - balance * r)) / Math.log(1 + r));
};

const totalInterestPaid = (balance: number, monthlyPayment: number, annualRate: number, months: number): number => {
  const r = annualRate / 100 / 12;
  if (months <= 0 || r === 0) return 0;
  return monthlyPayment * months - balance;
};

const formatMonths = (m: number | null): string => {
  if (m === null) return "Never (payment too low)";
  if (m === 0) return "Paid off";
  if (m < 12) return `${m} mo`;
  const years = Math.floor(m / 12);
  const rem = m % 12;
  return rem === 0 ? `${years}y` : `${years}y ${rem}mo`;
};

const AddDebtForm = memo(({ onAdd }: { onAdd: (d: Omit<Debt, "id" | "createdAt">) => void }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("credit_card");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [minPay, setMinPay] = useState("");

  const handleSubmit = () => {
    const bal = parseFloat(balance);
    const r = parseFloat(rate);
    const mp = parseFloat(minPay);
    if (!name.trim() || isNaN(bal) || bal <= 0 || isNaN(r) || r < 0 || isNaN(mp) || mp < 0) return;
    onAdd({
      name: name.trim(),
      type,
      originalBalance: bal,
      currentBalance: bal,
      interestRate: r,
      minimumPayment: mp,
    });
    setName(""); setBalance(""); setRate(""); setMinPay(""); setType("credit_card");
  };

  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Visa Card" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as DebtType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(DEBT_TYPE_LABELS) as DebtType[]).map((t) => (
                <SelectItem key={t} value={t}>{DEBT_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Balance ($)</Label>
          <Input type="number" min="0" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="5000" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Interest (% APR)</Label>
          <Input type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="18.5" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Min. Payment ($)</Label>
          <Input type="number" min="0" step="0.01" value={minPay} onChange={(e) => setMinPay(e.target.value)} placeholder="150" />
        </div>
      </div>
      <Button size="sm" onClick={handleSubmit} className="w-full sm:w-auto">
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Debt
      </Button>
    </div>
  );
});
AddDebtForm.displayName = "AddDebtForm";

const DebtRow = memo(({ debt, onPay, onDelete }: {
  debt: Debt;
  onPay: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}) => {
  const [paymentInput, setPaymentInput] = useState("");
  const progress = debt.originalBalance > 0
    ? ((debt.originalBalance - debt.currentBalance) / debt.originalBalance) * 100
    : 0;
  const months = monthsToPayoff(debt.currentBalance, debt.minimumPayment, debt.interestRate);
  const interest = months !== null && months > 0
    ? totalInterestPaid(debt.currentBalance, debt.minimumPayment, debt.interestRate, months)
    : 0;
  const isPaidOff = debt.currentBalance === 0;
  const stuck = months === null && debt.currentBalance > 0;

  const handlePay = () => {
    const amt = parseFloat(paymentInput);
    if (!isNaN(amt) && amt > 0) {
      onPay(debt.id, amt);
      setPaymentInput("");
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${isPaidOff ? "bg-accent/5 border-accent/30" : "bg-muted/40 border-border/50"} space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm">{debt.name}</p>
            <Badge variant="secondary" className="text-[10px]">{DEBT_TYPE_LABELS[debt.type]}</Badge>
            {isPaidOff && <Badge className="text-[10px] bg-accent text-accent-foreground">Paid Off 🎉</Badge>}
            {stuck && (
              <Badge variant="destructive" className="text-[10px] inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Min. payment too low
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {debt.interestRate}% APR · Min ${debt.minimumPayment.toFixed(0)}/mo
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this debt?</AlertDialogTitle>
              <AlertDialogDescription>
                "{debt.name}" will be permanently removed from your tracker.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(debt.id)}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Balance</span>
          <span className="font-bold text-foreground tabular-nums">
            ${debt.currentBalance.toFixed(2)} / ${debt.originalBalance.toFixed(2)}
          </span>
        </div>
        <Progress value={progress} className="h-2 [&>div]:bg-accent" />
      </div>

      {!isPaidOff && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-background/60">
              <p className="text-muted-foreground">Payoff in</p>
              <p className="font-bold text-foreground tabular-nums">{formatMonths(months)}</p>
            </div>
            <div className="p-2 rounded bg-background/60">
              <p className="text-muted-foreground">Total interest</p>
              <p className="font-bold text-destructive tabular-nums">${interest.toFixed(0)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={paymentInput}
              onChange={(e) => setPaymentInput(e.target.value)}
              placeholder="Record payment ($)"
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handlePay} className="h-8 shrink-0">
              <DollarSign className="w-3.5 h-3.5 mr-1" /> Pay
            </Button>
          </div>
        </>
      )}
    </div>
  );
});
DebtRow.displayName = "DebtRow";

export const DebtTrackerCard = memo(() => {
  const { debts, addDebt, recordPayment, deleteDebt } = useDebts();
  const [showAdd, setShowAdd] = useState(false);

  const stats = useMemo(() => {
    const totalBalance = debts.reduce((s, d) => s + d.currentBalance, 0);
    const totalOriginal = debts.reduce((s, d) => s + d.originalBalance, 0);
    const totalPaid = totalOriginal - totalBalance;
    const totalMinPay = debts.reduce((s, d) => s + d.minimumPayment, 0);
    const activeDebts = debts.filter((d) => d.currentBalance > 0).length;
    return { totalBalance, totalOriginal, totalPaid, totalMinPay, activeDebts };
  }, [debts]);

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Debt Tracker
        </h4>
        <Button size="sm" variant={showAdd ? "secondary" : "default"} onClick={() => setShowAdd((s) => !s)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> {showAdd ? "Close" : "Add Debt"}
        </Button>
      </div>

      {debts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-muted/40">
            <p className="text-muted-foreground">Total owed</p>
            <p className="font-bold text-destructive tabular-nums text-sm">${stats.totalBalance.toFixed(0)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40">
            <p className="text-muted-foreground">Paid off</p>
            <p className="font-bold text-accent tabular-nums text-sm">${stats.totalPaid.toFixed(0)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40">
            <p className="text-muted-foreground">Min/month</p>
            <p className="font-bold text-foreground tabular-nums text-sm">${stats.totalMinPay.toFixed(0)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40">
            <p className="text-muted-foreground">Active</p>
            <p className="font-bold text-foreground tabular-nums text-sm">{stats.activeDebts}</p>
          </div>
        </div>
      )}

      {showAdd && <AddDebtForm onAdd={(d) => { addDebt(d); setShowAdd(false); }} />}

      {debts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6 flex flex-col items-center gap-2">
          <TrendingDown className="w-6 h-6 opacity-40" />
          No debts tracked. Add one to see payoff projections.
        </p>
      ) : (
        <div className="space-y-3">
          {debts.map((d) => (
            <DebtRow key={d.id} debt={d} onPay={recordPayment} onDelete={deleteDebt} />
          ))}
        </div>
      )}
    </div>
  );
});
DebtTrackerCard.displayName = "DebtTrackerCard";
