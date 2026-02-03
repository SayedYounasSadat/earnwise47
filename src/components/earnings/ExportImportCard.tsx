// Export/Import functionality card
import { memo, useRef } from "react";
import { Download, Upload, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportImportCardProps {
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportJSON: (file: File) => void;
}

export const ExportImportCard = memo(
  ({ onExportJSON, onExportCSV, onImportJSON }: ExportImportCardProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImportJSON(file);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    return (
      <div className="glass-card rounded-xl p-6 card-hover">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Backup & Restore</h3>
        </div>

        <div className="space-y-4">
          {/* Export section */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Export your data for backup or analysis
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onExportJSON}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                Export JSON
              </Button>
              <Button
                onClick={onExportCSV}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Import section */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Restore from a previous backup
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import JSON Backup
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ExportImportCard.displayName = "ExportImportCard";
