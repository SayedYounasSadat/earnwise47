import { memo, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ResetDataCardProps {
  onResetAll: () => void;
  onClearLogs: () => void;
}

export const ResetDataCard = memo(({ onResetAll, onClearLogs }: ResetDataCardProps) => {
  return (
    <div className="glass-card rounded-xl p-6 card-hover border-destructive/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="font-semibold text-foreground">Danger Zone</h3>
      </div>

      <div className="space-y-4">
        {/* Clear Logs */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium text-sm text-foreground">Clear Session Logs</p>
            <p className="text-xs text-muted-foreground">
              Remove all session history. Settings and schedule are kept.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                Clear Logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all session logs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your work sessions and earnings history.
                  Your settings, schedule, and hourly rate will be preserved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearLogs}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Clear Logs
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Full Reset */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
          <div>
            <p className="font-medium text-sm text-foreground">Reset Everything</p>
            <p className="text-xs text-muted-foreground">
              Erase all data — sessions, settings, schedule — back to factory defaults.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently erase <strong>everything</strong> — all sessions,
                  earnings, settings, schedule, and cloud data. This action cannot be undone.
                  Consider exporting a backup first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onResetAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
});

ResetDataCard.displayName = "ResetDataCard";
