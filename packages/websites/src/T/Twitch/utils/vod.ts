export const getClipInfo = (): { title?: string; creator?: string } => {
  const title = document.querySelector("article h1")?.textContent?.trim()
  const creator = document.querySelector(".clip-creator a")?.textContent?.trim()
  return { title, creator }
}

export const getVodTitle = (): string | undefined =>
  document.title.replace(" - Twitch", "").split(" - ")[0]?.trim()

export const getVodThumbnail = (): string | undefined =>
  document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content || undefined
