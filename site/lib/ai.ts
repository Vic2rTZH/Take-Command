import "server-only";

export const aiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export type BriefDraft = { subject: string; bluf: string; ideas: string[]; questions: string[]; action: string };

const SYSTEM = `You draft The Take Command Brief, a short newsletter by Victor Simz.
Take Command helps people think clearer, lead better and take greater control of the life they are building, drawing on military strategy, leadership, systems thinking and practical experience.
Voice: clear, direct, practical and calm. Short sentences. No hype, no clichés, no exclamation marks, no emoji, no hashtags. Write for capable adults. British spelling.
Always write "Take Command" with capital T and C.
Never invent statistics, studies, quotes or personal stories. Use only facts the author gives you; otherwise keep ideas general and practical.
Format, exactly:
- subject: an email subject line, under 60 characters.
- bluf: the bottom line up front, one or two sentences.
- ideas: exactly 3 short insights, 1 to 3 sentences each.
- questions: exactly 2 reflective questions the reader asks themselves this week.
- action: exactly 1 concrete action to take before the next issue, one or two sentences.`;

const TOOL = {
  name: "write_brief",
  description: "Return the newsletter issue in the fixed format.",
  input_schema: {
    type: "object",
    properties: {
      subject: { type: "string" },
      bluf: { type: "string" },
      ideas: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
      questions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
      action: { type: "string" },
    },
    required: ["subject", "bluf", "ideas", "questions", "action"],
  },
};

export async function draftBrief(notes: string, current?: BriefDraft): Promise<{ ok: true; draft: BriefDraft } | { ok: false; message: string }> {
  // Trim: a key pasted with a trailing space or line break makes the request fail before it is sent.
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { ok: false, message: "AI drafting is not set up. Add ANTHROPIC_API_KEY in Vercel." };

  const hasCurrent = current && [current.subject, current.bluf, current.action, ...current.ideas, ...current.questions].some((x) => x.trim());
  const prompt = hasCurrent
    ? `Here is the current draft as JSON:\n${JSON.stringify(current)}\n\nRevise it following these instructions from the author:\n${notes}`
    : `Write this issue from the author's topic and notes:\n${notes}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(55000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "write_brief" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.message || `status ${res.status}`;
      return { ok: false, message: `The AI request failed: ${msg}` };
    }
    const block = (data?.content ?? []).find((c: { type: string }) => c.type === "tool_use");
    const d = block?.input as BriefDraft | undefined;
    if (!d || !Array.isArray(d.ideas) || !Array.isArray(d.questions)) return { ok: false, message: "The AI returned an incomplete draft. Try again." };
    return {
      ok: true,
      draft: {
        subject: String(d.subject || ""),
        bluf: String(d.bluf || ""),
        ideas: [0, 1, 2].map((i) => String(d.ideas[i] || "")),
        questions: [0, 1].map((i) => String(d.questions[i] || "")),
        action: String(d.action || ""),
      },
    };
  } catch (e) {
    const detail = e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e);
    console.error("AI request failed", e);
    return { ok: false, message: `Could not reach the AI service (${detail.slice(0, 160)}). Try again.` };
  }
}
