// Session notes input card
import { memo, useState, useEffect, useCallback } from "react";
import { FileText, Save, Mic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotesCardProps {
  onSaveNotes: (notes: string) => void;
  isWorking: boolean;
}

const MAX_CHARS = 500;

export const NotesCard = memo(({ onSaveNotes, isWorking }: NotesCardProps) => {
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  // Auto-save notes to parent every time they change (debounced)
  useEffect(() => {
    if (!notes.trim() || !isWorking) return;
    const t = setTimeout(() => onSaveNotes(notes.trim()), 1000);
    return () => clearTimeout(t);
  }, [notes, isWorking, onSaveNotes]);

  const handleSave = useCallback(() => {
    if (notes.trim()) {
      onSaveNotes(notes.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [notes, onSaveNotes]);

  const charCount = notes.length;
  const isNearLimit = charCount > MAX_CHARS * 0.8;

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 sm:p-6 card-hover transition-all",
      isWorking && "border-primary/20"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Session Notes</h3>
        {isWorking && (
          <span className="ml-auto text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
            Recording
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, MAX_CHARS))}
          placeholder={
            isWorking
              ? "What are you working on? Add notes, tasks, or reminders..."
              : "Start a session to add notes..."
          }
          className={cn(
            "min-h-[80px] sm:min-h-[100px] bg-background resize-none transition-all text-sm",
            !isWorking && "opacity-50"
          )}
          disabled={!isWorking}
        />

        <div className="flex items-center justify-between">
          <span className={cn(
            "text-[10px] tabular-nums transition-colors",
            isNearLimit ? "text-warning" : "text-muted-foreground"
          )}>
            {charCount}/{MAX_CHARS}
          </span>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Auto-saves with session
            </p>
            <Button
              onClick={handleSave}
              disabled={!isWorking || !notes.trim()}
              size="sm"
              variant={saved ? "default" : "secondary"}
              className={cn(
                "h-7 text-xs gap-1",
                saved && "bg-success text-success-foreground"
              )}
            >
              <Save className="w-3 h-3" />
              {saved ? "Saved!" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

NotesCard.displayName = "NotesCard";
