import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { createButton, getTitle } from "./dom"
import { ProductAssets } from "./products"

export const handleGitHubUniverse = async (
  presence: PresenceInstance,
  href: string,
): Promise<void> => {
  await presence.setActivity({
    details: "Browsing GitHub Universe",
    state: getTitle("GitHub Universe"),
    largeImageKey: ProductAssets.UniverseLogo,
    largeImageText: "GitHub Universe",
    type: PresenceType.Watching,
    buttons: [createButton("View GitHub Universe", href)],
  })
}
