import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WorkSession } from "@/types/earnings";
import { cn } from "@/lib/utils";

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  session?: WorkSession;
  hourlyRate: number;
  existingProjects: string[];
  onSave: (data: { date: string; startTime: number; endTime: number; notes: string; project: string }) => void;
}

export const SessionFormDialog = ({
  open,
  onOpenChange,
  mode,
  session,
  hourlyRate,
  existingProjects,
  onSave,
}: SessionFormDialogProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [project, setProject] = useState("");
  const [error, setError] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && session) {
      setDate(new Date(session.date + "T00:00:00"));
      const st = new Date(session.startTime);
      const et = session.endTime ? new Date(session.endTime) : null;
      setStartTime(`${String(st.getHours()).padStart(2, "0")}:${String(st.getMinutes()).padStart(2, "0")}`);
      setEndTime(et ? `${String(et.getHours()).padStart(2, "0")}:${String(et.getMinutes()).padStart(2, "0")}` : "");
      setNotes(session.notes || "");
      setProject(session.project || "");
    } else {
      setDate(new Date());
      setStartTime("");
      setEndTime("");
      setNotes("");
      setProject("");
    }
    setError("");
  }, [open, mode, session]);

  const calculatedEarnings = useMemo(() => {
    if (!date || !startTime || !endTime) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) return null;
    const durationSec = (endMin - startMin) * 60;
    return (durationSec / 3600) * hourlyRate;
  }, [date, startTime, endTime, hourlyRate]);

  const handleSubmit = () => {
    if (!date) { setError("Date is required"); return; }
    if (!startTime || !endTime) { setError("Start and end times are required"); return; }

    const dateStr = format(date, "yyyy-MM-dd");
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    if (endMin <= startMin) { setError("End time must be after start time"); return; }

    const dateObj = new Date(dateStr + "T00:00:00");
    if (dateObj > new Date()) { setError("Date cannot be in the future"); return; }

    const startTimestamp = new Date(dateStr + `T${startTime}:00`).getTime();
    const endTimestamp = new Date(dateStr + `T${endTime}:00`).getTime();

    onSave({
      date: dateStr,
      startTime: startTimestamp,
      endTime: endTimestamp,
      notes: notes.trim().slice(0, 500),
      project: project.trim().slice(0, 50),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Session" : "Edit Session"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Manually add a work session." : "Update this session's details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label>Project / Client (optional)</Label>
            <Input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Acme Corp"
              list="project-suggestions"
              maxLength={50}
            />
            {existingProjects.length > 0 && (
              <datalist id="project-suggestions">
                {existingProjects.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Earnings preview */}
          {calculatedEarnings !== null && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">
                Estimated earnings: <span className="text-accent">${calculatedEarnings.toFixed(2)}</span>
              </span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{mode === "add" ? "Add Session" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
