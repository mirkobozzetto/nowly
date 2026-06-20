import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { createButton, getPathSegments, getTitle } from "./dom"
import { getMetaImage, toDiscordImage } from "./images"

export const handleDiscoveryPage = async (
  presence: PresenceInstance,
  pathname: string,
  href: string,
): Promise<boolean> => {
  const [first, second, third, fourth] = getPathSegments(pathname)

  if (first === "marketplace") {
    await handleMarketplacePage(presence, second, third, fourth, href)
    return true
  }

  if (pathname === "/explore") {
    await setLogoActivity(presence, "Exploring GitHub")
    return true
  }

  if (first === "topics" && second) {
    await setLogoActivity(presence, "Exploring a topic", topicName(second), [createButton("View topic", href)])
    return true
  }

  if (pathname === "/trending") {
    await setLogoActivity(presence, "Viewing trending repositories")
    return true
  }

  if (pathname === "/collections") {
    await setLogoActivity(presence, "Browsing collections")
    return true
  }

  if (first === "collections" && second) {
    await setLogoActivity(presence, "Viewing a collection", getTitle(collectionName(second)), [createButton("View collection", href)])
    return true
  }

  if (pathname === "/sponsors/explore") {
    await setLogoActivity(presence, "Exploring GitHub Sponsors")
    return true
  }

  return false
}

const handleMarketplacePage = async (
  presence: PresenceInstance,
  second: string | undefined,
  third: string | undefined,
  fourth: string | undefined,
  href: string,
): Promise<void> => {
  if (second === "models" && third && fourth) {
    const image = await toDiscordImage(getMetaImage())
    await presence.setActivity({
      details: "Viewing a Marketplace model",
      state: getTitle(modelName(fourth)),
      largeImageKey: image || Assets.Logo,
      largeImageText: "GitHub Marketplace",
      type: PresenceType.Watching,
      buttons: [createButton("View model", href)],
    })
    return
  }

  await setLogoActivity(presence, "Browsing Marketplace", second ? getTitle("GitHub Marketplace") : undefined)
}

const setLogoActivity = async (
  presence: PresenceInstance,
  details: string,
  state?: string,
  buttons?: Array<{ label: string, url: string }>,
): Promise<void> => {
  await presence.setActivity({
    details,
    state,
    buttons,
    largeImageKey: Assets.Logo,
    largeImageText: "GitHub",
    type: PresenceType.Watching,
  })
}

const topicName = (topic: string): string =>
  topic.replace(/-/g, " ")

const collectionName = (collection: string): string =>
  collection.replace(/-/g, " ")

const modelName = (model: string): string =>
  model.replace(/-/g, " ")
