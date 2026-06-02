import { z } from "zod"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const LOCALES = ["en-US", "fr-FR", "es-ES"] as const

const ChangelogSchema = z.object({
  "en-US": z.string().min(1),
  "fr-FR": z.string().min(1),
  "es-ES": z.string().min(1),
})

interface ChangelogContext {
  type: "new" | "modified"
  name: string
  names?: Record<string, string>
  description?: string
  descriptions?: Record<string, string>
  prTitle?: string
}

const fallbackChangelogs = (ctx: ChangelogContext): z.infer<typeof ChangelogSchema> => {
  if (ctx.type === "new") {
    const desc = ctx.description || ""
    return {
      "en-US": `Add ${ctx.names?.["en-US"] || ctx.name} presence${desc ? ` - ${desc}` : ""}`,
      "fr-FR": `Ajout de ${ctx.names?.["fr-FR"] || ctx.name}${desc ? ` - ${desc}` : ""}`,
      "es-ES": `Añadir ${ctx.names?.["es-ES"] || ctx.name}${desc ? ` - ${desc}` : ""}`,
    }
  }

  const title = ctx.prTitle || `Update ${ctx.name} presence`
  return { "en-US": title, "fr-FR": title, "es-ES": title }
}

export const generateChangelog = async (ctx: ChangelogContext): Promise<z.infer<typeof ChangelogSchema>> => {
  if (!OPENAI_API_KEY) return fallbackChangelogs(ctx)

  const nameEn = ctx.names?.["en-US"] || ctx.name
  const nameFr = ctx.names?.["fr-FR"] || nameEn
  const nameEs = ctx.names?.["es-ES"] || nameEn
  const descEn = ctx.descriptions?.["en-US"] || ctx.description || ""
  const descFr = ctx.descriptions?.["fr-FR"] || descEn
  const descEs = ctx.descriptions?.["es-ES"] || descEn

  const isNew = ctx.type === "new"
  const prompt = isNew
    ? `Generate changelog entries in 3 languages for adding a new presence.
Name (en): ${nameEn}
Name (fr): ${nameFr}
Name (es): ${nameEs}
Description (en): ${descEn}
Description (fr): ${descFr}
Description (es): ${descEs}

Return a JSON object with keys "en-US", "fr-FR", "es-ES". Each value must be a concise single-line changelog (max 12 words).
Example: {"en-US":"Add YouTube presence - Watch videos","fr-FR":"Ajout de YouTube - Regarder des vidéos","es-ES":"Añadir YouTube - Ver videos"}`
    : `Generate changelog entries in 3 languages for an updated presence.
Name (en): ${nameEn}
Name (fr): ${nameFr}
Name (es): ${nameEs}
PR title: ${ctx.prTitle || ""}

Return a JSON object with keys "en-US", "fr-FR", "es-ES". Each value must be a concise single-line changelog (max 12 words).
Example: {"en-US":"Fix video playback issues","fr-FR":"Correction des problèmes de lecture","es-ES":"Corrección de problemas de reproducción"}`

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
        response_format: { type: "json_object" },
        max_tokens: 200,
        temperature: 0.3,
      }),
    })

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)

    const data = await res.json() as { choices: { message: { content: string } }[] }
    const raw = data.choices[0].message.content.trim()

    const parsed = JSON.parse(raw)
    const result = ChangelogSchema.parse(parsed)
    return result
  } catch {
    return fallbackChangelogs(ctx)
  }
}
