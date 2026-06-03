export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export const parseJSONScript = (text: string, marker: string): unknown => {
  const start = text.indexOf(marker)
  if (start === -1) return null
  const jsonStart = text.indexOf("{", start)
  if (jsonStart === -1) return null
  let depth = 0
  let inString = false
  for (let i = jsonStart; i < text.length; i++) {
    if (text[i] === "\\") { i++; continue }
    if (text[i] === '"') inString = !inString
    if (inString) continue
    if (text[i] === "{") depth++
    if (text[i] === "}") depth--
    if (depth === 0) {
      try {
        return JSON.parse(text.slice(jsonStart, i + 1))
      } catch {
        return null
      }
    }
  }
  return null
}

export const cleanUploader = (value: string | undefined): string | undefined => {
  const cleaned = value
    ?.replace(/\s+/g, " ")
    .replace(/^Accéder à la chaîne\s+/i, "")
    .replace(/^Go to channel\s+/i, "")
    .trim()

  if (!cleaned || cleaned === "YouTube") return undefined
  const handle = cleaned.match(/(^|\s)(@[A-Za-z0-9._-]+)/)?.[2]
  if (handle && /channel|chaine|cha.ne|Acc|subscribe|abonner|^@/i.test(cleaned)) return handle
  if (cleaned.startsWith("Accéder à la chaîne ")) return cleaned.replace("Accéder à la chaîne ", "").trim()
  return cleaned
}

export const cleanTitle = (value: string | undefined): string | undefined => {
  const cleaned = value
    ?.replace(/\s+/g, " ")
    .replace(/ - YouTube$/, "")
    .trim()

  if (!cleaned || cleaned === "YouTube") return undefined
  return cleaned
}

export const titleMatches = (currentTitle: string | undefined, candidateTitle: string | undefined): boolean => {
  const current = cleanTitle(currentTitle)?.toLowerCase()
  const candidate = cleanTitle(candidateTitle)?.toLowerCase()

  if (!current) return true
  if (!candidate) return false
  return current === candidate || current.includes(candidate) || candidate.includes(current)
}

export const extractTextValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return cleanUploader(value)
  if (!isRecord(value)) return undefined

  if (typeof value.name === "string") return cleanUploader(value.name)
  if (typeof value.simpleText === "string") return cleanUploader(value.simpleText)
  if (typeof value.content === "string") return cleanUploader(value.content)

  if (Array.isArray(value.runs)) {
    const text = value.runs
      .map((run) => isRecord(run) && typeof run.text === "string" ? run.text : "")
      .join("")
    return cleanUploader(text)
  }

  return undefined
}

export const extractTitleValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return cleanTitle(value)
  if (!isRecord(value)) return undefined

  if (typeof value.title === "string") return cleanTitle(value.title)
  if (typeof value.simpleText === "string") return cleanTitle(value.simpleText)
  if (typeof value.content === "string") return cleanTitle(value.content)

  if (Array.isArray(value.runs)) {
    const text = value.runs
      .map((run) => isRecord(run) && typeof run.text === "string" ? run.text : "")
      .join("")
    return cleanTitle(text)
  }

  return undefined
}

export const decodeHtml = (value: string): string => {
  const textarea = document.createElement("textarea")
  textarea.innerHTML = value
  return textarea.value
}

export const textFromHTML = (html: string, selector: string): string | undefined => {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.querySelector(selector)?.textContent?.trim() || undefined
}
