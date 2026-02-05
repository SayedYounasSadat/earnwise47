// Client-side email PDF dialog - generates PDF, downloads it, opens mailto
import { memo, useState } from "react";
import { Mail, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface EmailPDFDialogProps {
  onGeneratePDF: () => void;
}

export const EmailPDFDialog = memo(({ onGeneratePDF }: EmailPDFDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!email.trim()) {
      toast({
        title: "❌ Email Required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }

    // 1. Generate & download the PDF
    onGeneratePDF();

    // 2. Open mailto with pre-filled content
    const subject = encodeURIComponent(`Earnings Report - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease find my earnings report attached.\n\nThis report was generated on ${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}.\n\nBest regards`
    );

    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");

    setSent(true);

    toast({
      title: "📧 Email Client Opened",
      description: "The PDF has been downloaded. Please attach it to the email.",
    });
  };

  const handleClose = () => {
    setOpen(false);
    setSent(false);
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Email Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Earnings Report
          </DialogTitle>
          <DialogDescription>
            We'll download the PDF and open your email client with a pre-filled message. Just attach the downloaded file and send!
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSend} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download & Open Email
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                  <Download className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Step 1: PDF Downloaded</p>
                  <p className="text-xs text-muted-foreground">Check your downloads folder</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                  <ExternalLink className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Step 2: Email Client Opened</p>
                  <p className="text-xs text-muted-foreground">Attach the PDF and hit send</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <Button variant="secondary" onClick={() => { setSent(false); }}>
                Send to Another
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

EmailPDFDialog.displayName = "EmailPDFDialog";
