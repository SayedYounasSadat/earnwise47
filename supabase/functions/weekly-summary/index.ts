// AI Weekly Summary edge function
// Receives last 7 days of session data and returns a streamed AI-generated recap

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SessionInput {
  date: string;
  durationHours: number;
  earnings: number;
  project?: string;
  notes?: string;
}

interface RequestBody {
  sessions: SessionInput[];
  hourlyRate: number;
  dailyGoal: number;
  currencyCode: string;
  exchangeRate: number;
  weekStart: string;
  weekEnd: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: RequestBody = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalHours = body.sessions.reduce((s, x) => s + x.durationHours, 0);
    const totalEarnings = body.sessions.reduce((s, x) => s + x.earnings, 0);
    const daysWorked = new Set(body.sessions.map((s) => s.date)).size;

    const sessionsSummary = body.sessions
      .map(
        (s) =>
          `${s.date}: ${s.durationHours.toFixed(2)}h, $${s.earnings.toFixed(2)}${
            s.project ? ` [${s.project}]` : ""
          }${s.notes ? ` — ${s.notes.slice(0, 80)}` : ""}`
      )
      .join("\n");

    const systemPrompt = `You are an upbeat productivity coach for EarnWise, a freelance time-tracking app. 
Generate a short, friendly weekly recap in markdown. Use a confident tone, second person ("you"), and include:
- A 1-line opener celebrating or contextualizing the week
- A "Highlights" bullet list (3-4 items) with concrete numbers
- A "Patterns" section noting trends, busiest day, or session habits
- A "Suggestions" section with 2-3 actionable tips for next week
Keep total length under 250 words. No greetings like "Hi there".`;

    const userPrompt = `Week: ${body.weekStart} → ${body.weekEnd}
Hourly rate: $${body.hourlyRate}/hr
Daily goal: $${body.dailyGoal}
Totals: ${totalHours.toFixed(2)}h worked, $${totalEarnings.toFixed(2)} earned across ${daysWorked} day(s).

Sessions:
${sessionsSummary || "(No sessions logged this week.)"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI gateway error: ${text}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const summary = data.choices?.[0]?.message?.content ?? "No summary generated.";

    return new Response(
      JSON.stringify({
        summary,
        stats: { totalHours, totalEarnings, daysWorked, sessionCount: body.sessions.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
