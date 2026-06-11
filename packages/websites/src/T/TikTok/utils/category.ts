export const extractLiveCategoryPath = (pathname: string): { section: string; category: string } | undefined => {
  const match = pathname.match(/^\/live\/category\/([^/]+)\/([^/?#]+)/)
  if (!match?.[1] || !match[2]) return undefined
  return { section: match[1], category: match[2] }
}

export const formatSlug = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  const decoded = decodeURIComponent(value).replace(/[_-]+/g, " ").trim()
  return decoded || undefined
}

export const extractLiveCategoryName = (categorySlug: string | undefined): string | undefined => {
  const selectors = [
    "[data-e2e=\"live-category-title\"]",
    "main h1",
    "h1",
  ] as const

  for (const selector of selectors) {
    const text = document.querySelector<HTMLElement>(selector)?.textContent?.trim()
    if (text) return text
  }

  const titleMatch = document.title.match(/^(.+?)\s*[-|]\s*TikTok/i)
  if (titleMatch?.[1]?.trim()) return titleMatch[1].trim()

  return formatSlug(categorySlug)
}

export const extractLiveCategoryImage = (): string | undefined => {
  const selectors = [
    "main img[src*=\"tiktokcdn\"]",
    "img[src*=\"tiktokcdn\"]",
    "meta[property=\"og:image\"]",
  ] as const

  for (const selector of selectors) {
    const node = document.querySelector<HTMLImageElement | HTMLMetaElement>(selector)
    const src = node instanceof HTMLMetaElement
      ? node.content
      : node?.currentSrc || node?.src || node?.getAttribute("src")
    if (src?.includes("tiktokcdn")) return src
  }

  return undefined
}
