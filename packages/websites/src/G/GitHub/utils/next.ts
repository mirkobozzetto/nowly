import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { createButton, getPathSegments, getTitle } from "./dom"
import { ProductAssets } from "./products"

export const handleGitHubNext = async (
  presence: PresenceInstance,
  pathname: string,
  href: string,
): Promise<void> => {
  const [first, second] = getPathSegments(pathname)

  if (pathname === "/" || pathname === "") {
    await setNextActivity(presence, "Browsing GitHub Next")
    return
  }

  if (first === "projects" && second) {
    await setNextActivity(presence, "Viewing a GitHub Next project", getTitle(projectName(second)), href)
    return
  }

  if (first === "posts" && second) {
    await setNextActivity(presence, "Reading a GitHub Next post", getTitle(postName(second)), href)
    return
  }

  if (pathname === "/talks") {
    await setNextActivity(presence, "Browsing GitHub Next talks")
    return
  }

  if (first === "talks" && second) {
    await setNextActivity(presence, "Watching a GitHub Next talk", getTitle(talkName(second)), href)
    return
  }

  await setNextActivity(presence, "Browsing GitHub Next", getTitle("GitHub Next"), href)
}

const setNextActivity = async (
  presence: PresenceInstance,
  details: string,
  state?: string,
  href?: string,
): Promise<void> => {
  await presence.setActivity({
    details,
    state,
    largeImageKey: ProductAssets.GitHubNextLogo,
    largeImageText: "GitHub Next",
    type: PresenceType.Watching,
    buttons: href ? [createButton("View on GitHub Next", href)] : undefined,
  })
}

const projectName = (slug: string): string =>
  slug.replace(/-/g, " ")

const postName = (slug: string): string =>
  slug.replace(/-/g, " ")

const talkName = (slug: string): string =>
  slug.replace(/-/g, " ")
