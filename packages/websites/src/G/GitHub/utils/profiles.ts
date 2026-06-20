import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { createButton, getTitle } from "./dom"
import { getAvatarImage, getMetaImage, toDiscordImage } from "./images"

export const handleProfilePage = async (
  presence: PresenceInstance,
  username: string,
  href: string,
): Promise<void> => {
  const avatar = await toDiscordImage(getAvatarImage(username) || getMetaImage())
  const title = getProfileTitle(username)

  await presence.setActivity({
    details: "Viewing a profile",
    state: title,
    largeImageKey: avatar || Assets.Logo,
    largeImageText: title,
    type: PresenceType.Watching,
    buttons: getProfileButtons(href),
  })
}

const getProfileTitle = (username: string): string => {
  const title = getTitle(username)
  if (!title || title === "GitHub") return username
  return title.replace(/\s+\(@[^)]+\)$/, "") || username
}

const getProfileButtons = (href: string): Array<{ label: string, url: string }> => {
  const buttons = [createButton("View profile", href)]
  const sponsor = document.querySelector<HTMLAnchorElement>("#sponsor-profile-button, a[href^='/sponsors/'][aria-label^='Sponsor']")

  if (sponsor?.href || sponsor?.getAttribute("href")) {
    buttons.push(createButton("Sponsor", sponsor.href || sponsor.getAttribute("href") || ""))
  }

  return buttons.slice(0, 2)
}