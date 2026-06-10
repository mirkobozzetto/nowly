export const findCategoryImage = (): string | undefined => {
  const img = document.querySelector<HTMLImageElement>('main img[src*="ttv-boxart"]')
  if (!img?.src) return undefined
  return img.src.replace(/-\d+x\d+(\.\w+)$/, "-285x380$1")
}

export const findCategoryName = (): string | undefined => {
  const selectors = [
    '[data-test-selector="directory-header-title"]',
    '[class*="game-header"] h1',
    '[class*="directory-header"] h1',
    'main h1',
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  // Fallback: parse document title ("Resident Evil 2 - Twitch")
  const match = document.title.match(/^(.+?)\s*[-–]\s*Twitch/)
  return match?.[1]?.trim()
}
