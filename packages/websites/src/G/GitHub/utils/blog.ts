import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { createButton, cleanTitle, getMetaContent } from "./dom"
import { getMetaImage, toDiscordImage } from "./images"

export const handleBlog = async (
  presence: PresenceInstance,
  pathname: string,
  href: string,
): Promise<void> => {
  if (pathname === "/" || pathname === "") {
    await presence.setActivity({
      details: "Reading GitHub Blog",
      largeImageKey: Assets.Logo,
      largeImageText: "GitHub Blog",
      type: PresenceType.Watching,
    })
    return
  }

  const title = getArticleTitle()
  const image = await toDiscordImage(getMetaImage())

  await presence.setActivity({
    details: "Reading an article",
    state: title,
    largeImageKey: image || Assets.Logo,
    largeImageText: title || "GitHub Blog",
    type: PresenceType.Watching,
    buttons: [createButton("Read Article", href)],
  })
}

export const getArticleTitle = (): string => {
  const h1 = document.querySelector<HTMLHeadingElement>("h1")?.textContent?.trim()
  return cleanTitle(h1 || getMetaContent("og:title") || document.title) || "GitHub Blog"
}
