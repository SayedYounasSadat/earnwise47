// AI Weekly Summary card — calls the weekly-summary edge function
import { useState, useMemo } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { WorkSession, Settings } from "@/types/earnings";
import { toast } from "sonner";

interface AIWeeklySummaryProps {
  sessions: WorkSession[];
  settings: Settings;
}

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // Monday start
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const AIWeeklySummary = ({ sessions, settings }: AIWeeklySummaryProps) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalHours: number; totalEarnings: number; daysWorked: number } | null>(null);

  const { weekSessions, weekStart, weekEnd } = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const ws = sessions.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    return { weekSessions: ws, weekStart: start, weekEnd: end };
  }, [sessions]);

  const generate = async () => {
    setLoading(true);
    try {
      const payload = {
        sessions: weekSessions.map((s) => ({
          date: s.date,
          durationHours: s.duration / 3600,
          earnings: s.earnings,
          project: s.project,
          notes: s.notes,
        })),
        hourlyRate: settings.hourlyRate,
        dailyGoal: settings.dailyGoal,
        currencyCode: settings.currencyCode,
        exchangeRate: settings.exchangeRate,
        weekStart: weekStart.toISOString().slice(0, 10),
        weekEnd: weekEnd.toISOString().slice(0, 10),
      };

      const { data, error } = await supabase.functions.invoke("weekly-summary", {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSummary(data.summary);
      setStats(data.stats);
    } catch (e) {
      toast.error((e as Error).message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (md: string) => {
    // Lightweight markdown rendering: bold, italics, headings, bullets
    const lines = md.split("\n");
    const out: JSX.Element[] = [];
    let listBuf: string[] = [];
    const flushList = () => {
      if (listBuf.length) {
        out.push(
          <ul key={`ul-${out.length}`} className="list-disc ml-5 space-y-1 text-sm text-foreground/90">
            {listBuf.map((li, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />
            ))}
          </ul>
        );
        listBuf = [];
      }
    };
    const inline = (s: string) =>
      s
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code class='px-1 py-0.5 rounded bg-muted text-xs'>$1</code>");

    lines.forEach((raw, idx) => {
      const line = raw.trimEnd();
      if (/^#{1,6}\s/.test(line)) {
        flushList();
        const level = line.match(/^#+/)![0].length;
        const text = line.replace(/^#+\s/, "");
        const Tag = (`h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements);
        out.push(
          <Tag key={idx} className="font-semibold text-foreground mt-3 mb-1 text-sm">
            <span dangerouslySetInnerHTML={{ __html: inline(text) }} />
          </Tag>
        );
      } else if (/^\s*[-*]\s+/.test(line)) {
        listBuf.push(line.replace(/^\s*[-*]\s+/, ""));
      } else if (line.trim() === "") {
        flushList();
      } else {
        flushList();
        out.push(
          <p key={idx} className="text-sm text-foreground/90 leading-relaxed mb-2">
            <span dangerouslySetInnerHTML={{ __html: inline(line) }} />
          </p>
        );
      }
    });
    flushList();
    return out;
  };

  return (
    <div className="surface-card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Weekly Summary</h3>
            <p className="text-xs text-muted-foreground">
              Personalized recap of {weekStart.toLocaleDateString()} → {weekEnd.toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={generate} disabled={loading} variant={summary ? "outline" : "default"}>
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
          ) : summary ? (
            <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Generate</>
          )}
        </Button>
      </div>

      {!summary && !loading && (
        <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
          {weekSessions.length === 0
            ? "No sessions logged this week yet — start tracking to get a recap."
            : `${weekSessions.length} session(s) ready. Click Generate for an AI-powered recap.`}
        </div>
      )}

      {summary && stats && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-foreground">{stats.totalHours.toFixed(1)}h</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Hours</div>
            </div>
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-foreground">${stats.totalEarnings.toFixed(0)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Earned</div>
            </div>
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-foreground">{stats.daysWorked}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Days</div>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">{renderMarkdown(summary)}</div>
        </>
      )}
    </div>
  );
};
