export const cleanText = (value: string | null | undefined): string | undefined => {
  const cleaned = value?.replace(/\s+/g, " ").trim()
  if (!cleaned || cleaned === "YouTube Music") return undefined
  return cleaned
}

export const cleanTrackTitle = (value: string | null | undefined): string | undefined => {
  const cleaned = cleanText(value)
    ?.replace(/\s*(?:-|\|)\s*YouTube Music$/i, "")
    .trim()

  if (!cleaned || /youtube music/i.test(cleaned)) return undefined
  return cleaned
}

export const cleanArtist = (value: string | null | undefined): string | undefined => {
  const cleaned = cleanText(value)
  if (!cleaned || /^youtube music$/i.test(cleaned)) return undefined
  return cleaned
}

export const text = (selector: string, parent: ParentNode = document): string | undefined =>
  cleanText(parent.querySelector(selector)?.textContent)

export const attr = (selector: string, attribute: string, parent: ParentNode = document): string | undefined => {
  const value = parent.querySelector(selector)?.getAttribute(attribute)
  return cleanText(value)
}