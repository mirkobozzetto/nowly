import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { cleanTitle, createButton, getPathSegments, getTitle } from "./dom"
import { getAvatarImage, getMetaImage, toDiscordImage } from "./images"

export const handleGist = async (
  presence: PresenceInstance,
  pathname: string,
  href: string,
): Promise<void> => {
  const [first, second] = getPathSegments(pathname)

  if (pathname === "/" || pathname === "") {
    await presence.setActivity({
      details: "Browsing Gist",
      largeImageKey: Assets.Logo,
      largeImageText: "GitHub Gist",
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname === "/discover") {
    await presence.setActivity({
      details: "Discovering gists",
      largeImageKey: Assets.Logo,
      largeImageText: "GitHub Gist",
      type: PresenceType.Watching,
      buttons: [createButton("Explore Gists", href)],
    })
    return
  }

  if (first && !second) {
    const avatar = await toDiscordImage(getAvatarImage(first))

    await presence.setActivity({
      details: `Browsing ${first}'s Gist`,
      largeImageKey: avatar || Assets.Logo,
      largeImageText: first,
      type: PresenceType.Watching,
      buttons: [createButton("View Gists", href)],
    })
    return
  }

  if (first && second) {
    const avatar = await toDiscordImage(getAvatarImage(first) || getMetaImage())
    const secret = isSecretGist()

    await presence.setActivity({
      details: secret ? "Viewing a secret gist" : "Viewing a gist",
      state: getGistTitle(),
      largeImageKey: avatar || Assets.Logo,
      largeImageText: first,
      type: PresenceType.Watching,
      buttons: secret ? undefined : [createButton("View Gist", href)],
    })
    return
  }

  await presence.setActivity({
    details: "Browsing Gist",
    largeImageKey: Assets.Logo,
    largeImageText: "GitHub Gist",
    type: PresenceType.Watching,
  })
}

export const getGistTitle = (): string => {
  const title = getTitle("Gist")
  return cleanTitle(title)
    .replace(/\s*-\s*GitHub Gist\s*$/i, "")
    .replace(/\s*\u00b7\s*GitHub\s*$/i, "")
    .trim() || "Gist"
}

export const isSecretGist = (): boolean => {
  const labels = [
    document.querySelector('[title="Secret gist"]')?.textContent,
    document.querySelector('[aria-label="Secret gist"]')?.textContent,
    document.querySelector(".gist-secret")?.textContent,
  ]

  if (labels.some(Boolean)) return true

  const pageText = document.body?.textContent?.slice(0, 1000) || ""
  return /\bsecret gist\b/i.test(`${document.title} ${pageText}`)
}
