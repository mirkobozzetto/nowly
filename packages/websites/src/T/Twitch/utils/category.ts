export const findCategoryImage = (): string | undefined => {
  const selectors = [
    'main img[src*="ttv-boxart"]',
    'main img[src*="static-cdn.jtvnw.net/ttv-boxart"]',
    'img[src*="static-cdn.jtvnw.net/ttv-boxart"]',
    'meta[property="og:image"]',
  ] as const

  for (const selector of selectors) {
    const node = document.querySelector<HTMLImageElement | HTMLMetaElement>(selector)
    const src = node instanceof HTMLMetaElement ? node.content : node?.src
    if (src?.includes("ttv-boxart")) return upscaleCategoryImage(src)
  }

  return undefined
}

export const findCategoryName = (): string | undefined => {
  const selectors = [
    '[data-test-selector="directory-header-title"]',
    '[data-a-target="directory-game-header-title"]',
    '[data-a-target="directory-header-title"]',
    '[class*="game-header"] h1',
    '[class*="directory-header"] h1',
    "main h1",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  // Fallback: parse document title ("Resident Evil 2 - Twitch").
  const match = document.title.match(/^(.+?)\s*[-\u2013]\s*Twitch/)
  if (match?.[1]?.trim()) return match[1].trim()

  const categorySlug = location.pathname.match(/\/directory\/(?:category|game)\/([^/?#]+)/)?.[1]
  return categorySlug ? decodeURIComponent(categorySlug).replace(/\+/g, " ") : undefined
}

const upscaleCategoryImage = (url: string): string =>
  url.replace(/-\d+x\d+(\.\w+)(\?.*)?$/, "-285x380$1$2")
