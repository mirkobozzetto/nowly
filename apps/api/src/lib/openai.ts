const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface ChangelogContext {
  type: "new" | "modified"
  name: string
  prTitle?: string
  description?: string
}

export async function generateChangelog(ctx: ChangelogContext): Promise<string> {
  if (!OPENAI_API_KEY) {
    if (ctx.type === "new") return `Add ${ctx.name} presence${ctx.description ? ` - ${ctx.description}` : ""}`
    return ctx.prTitle || `Update ${ctx.name} presence`
  }

  const prompt =
    ctx.type === "new"
      ? `Generate a concise changelog entry (max 12 words) for adding a new presence.
Name: ${ctx.name}
Description: ${ctx.description || ""}
Write only the changelog text, e.g. "Add {Name} presence - {description}"`
      : `Generate a concise changelog entry (max 12 words) for an updated presence.
Presence: ${ctx.name}
PR title: ${ctx.prTitle || ""}
Write only the changelog text, e.g. "Update {Name}: {what changed}"`

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 60,
        temperature: 0.3,
      }),
    })

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)

    const data = await res.json() as { choices: { message: { content: string } }[] }
    return data.choices[0].message.content.trim()
  } catch {
    if (ctx.type === "new") return `Add ${ctx.name} presence`
    return ctx.prTitle || `Update ${ctx.name} presence`
  }
}
