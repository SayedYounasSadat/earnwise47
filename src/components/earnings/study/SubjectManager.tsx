// Subject creation + list management (Kauri-style chip cards)
import { useState } from "react";
import { Plus, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Subject, SubjectColor, SUBJECT_COLOR_HEX } from "@/types/study";
import { cn } from "@/lib/utils";

interface Props {
  subjects: Subject[];
  onAdd: (name: string, color: SubjectColor, goal?: number) => void;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  weeklyHoursBySubject: Record<string, number>;
}

const COLORS: SubjectColor[] = ["blue", "green", "purple", "orange", "pink", "cyan", "red", "yellow"];

export const SubjectManager = ({
  subjects, onAdd, onDelete, onSelect, selectedId, weeklyHoursBySubject,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<SubjectColor>("blue");
  const [goal, setGoal] = useState<string>("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd(name, color, goal ? Number(goal) : undefined);
    setName(""); setGoal(""); setColor("blue");
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Subjects
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Subject</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics, Spanish, Biology" autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-8 h-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                        color === c && "ring-2 ring-foreground scale-110"
                      )}
                      style={{ backgroundColor: SUBJECT_COLOR_HEX[c] }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Weekly goal (hours, optional)</Label>
                <Input type="number" min={0} step={0.5} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. 5" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!name.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No subjects yet. Add one to start tracking study time.</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {subjects.map((s) => {
            const hex = SUBJECT_COLOR_HEX[s.color];
            const wkHours = weeklyHoursBySubject[s.id] ?? 0;
            const goal = s.goalHoursPerWeek ?? 0;
            const pct = goal > 0 ? Math.min(100, (wkHours / goal) * 100) : 0;
            return (
              <div
                key={s.id}
                onClick={() => onSelect?.(s.id)}
                className={cn(
                  "group relative p-4 rounded-xl border transition-all cursor-pointer",
                  selectedId === s.id
                    ? "border-foreground bg-muted/50"
                    : "border-border hover:border-muted-foreground/40 bg-card"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {wkHours.toFixed(1)}h this week{goal > 0 && ` / ${goal}h goal`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    aria-label="Delete subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {goal > 0 && (
                  <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: hex }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
