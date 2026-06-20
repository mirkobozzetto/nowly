import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { createButton, getTitle } from "./dom"
import { getMetaImage, toDiscordImage } from "./images"
import { ProductAssets } from "./products"

export const handleGitHubUniverse = async (
  presence: PresenceInstance,
  href: string,
): Promise<void> => {
  const image = await toDiscordImage(getMetaImage())

  await presence.setActivity({
    details: "Browsing GitHub Universe",
    state: getTitle("GitHub Universe"),
    largeImageKey: image || ProductAssets.UniverseLogo,
    largeImageText: "GitHub Universe",
    type: PresenceType.Watching,
    buttons: [createButton("View GitHub Universe", href)],
  })
}