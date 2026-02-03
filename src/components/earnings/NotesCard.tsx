// Session notes input card
import { memo, useState } from "react";
import { FileText, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface NotesCardProps {
  onSaveNotes: (notes: string) => void;
  isWorking: boolean;
}

export const NotesCard = memo(({ onSaveNotes, isWorking }: NotesCardProps) => {
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (notes.trim()) {
      onSaveNotes(notes.trim());
      setNotes("");
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Session Notes</h3>
      </div>

      <div className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            isWorking
              ? "Add notes for this session..."
              : "Start working to add notes..."
          }
          className="min-h-[100px] bg-background resize-none"
          disabled={!isWorking}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Notes will be saved when you stop the timer
          </p>
          <Button
            onClick={handleSave}
            disabled={!isWorking || !notes.trim()}
            size="sm"
            variant="secondary"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
});

NotesCard.displayName = "NotesCard";
