export const normalizeHandle = (value: string | null | undefined): string | undefined => {
  const normalized = value?.trim().replace(/^@/, "")
  return normalized || undefined
}

export const extractProfileInfo = (): { username?: string; displayName?: string; bio?: string } => ({
  username: normalizeHandle(document.querySelector<HTMLElement>("[data-e2e=\"user-title\"]")?.textContent),
  displayName: document.querySelector<HTMLElement>("[data-e2e=\"user-subtitle\"]")?.textContent?.trim(),
  bio: document.querySelector<HTMLElement>("[data-e2e=\"user-bio\"]")?.textContent?.trim(),
})

export const extractProfileAvatar = (): string | undefined => {
  const avatar = document.querySelector<HTMLImageElement>("[data-e2e=\"user-avatar\"] img")
    ?? document.querySelector<HTMLImageElement>("[data-e2e=\"user-page\"] [data-e2e=\"user-avatar\"] img")
    ?? document.querySelector<HTMLImageElement>("img[alt][src*=\"tiktokcdn\"]")

  return avatar?.currentSrc || avatar?.src || avatar?.getAttribute("src") || undefined
}
