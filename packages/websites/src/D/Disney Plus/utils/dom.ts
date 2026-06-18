export const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    'video[id^="hivePlayer"]',
    ".btm-media-player video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}

export const findEntityTitle = (): string | undefined => {
  const img = document.querySelector<HTMLImageElement>('[data-testid="details-title-treatment"] img')
  if (img?.alt) return img.alt

  const title = document.title.split("|")[0]?.trim()
  return title || undefined
}

export const createDisneyImageUrl = (imageId: string): string =>
  `https://disney.images.edge.bamgrid.com/ripcut-delivery/v2/variant/disney/${imageId}/compose?format=png&width=512`

export const parseEpisodeState = (subtitle: string | undefined): string | undefined => {
  const episodeMatch = subtitle?.match(/S(\d+):E(\d+)\s+(.*)/)
  return episodeMatch
    ? `S${episodeMatch[1]}.E${episodeMatch[2]} ${episodeMatch[3]?.trim() || ""}`.trim()
    : subtitle
}

export const isEpisodeSubtitle = (subtitle: string | undefined): boolean =>
  Boolean(subtitle?.match(/S(\d+):E(\d+)\s+(.*)/))