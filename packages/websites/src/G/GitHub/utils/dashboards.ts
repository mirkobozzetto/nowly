import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { getIssueSection } from "./routes"

export const handleDashboardPage = async (
  presence: PresenceInstance,
  pathname: string,
  search: string,
): Promise<boolean> => {
  if (pathname === "/" || pathname === "" || pathname === "/feed") {
    await setLogoActivity(presence, "Browsing feed")
    return true
  }

  if (pathname === "/repos") {
    await setLogoActivity(presence, "Browsing repositories")
    return true
  }

  if (pathname === "/pulls/inbox") {
    await setLogoActivity(presence, "Checking pull requests", "Inbox")
    return true
  }

  if (pathname.startsWith("/issues/")) {
    const section = getIssueSection(pathname)
    if (!section) return false

    await setLogoActivity(presence, "Checking issues", section)
    return true
  }

  if (pathname === "/notifications" && (search.includes("is%3Aunread") || search.includes("is:unread"))) {
    await setLogoActivity(presence, "Checking notifications", "Unread")
    return true
  }

  return false
}

const setLogoActivity = async (
  presence: PresenceInstance,
  details: string,
  state?: string,
): Promise<void> => {
  await presence.setActivity({
    details,
    state,
    largeImageKey: Assets.Logo,
    largeImageText: "GitHub",
    type: PresenceType.Watching,
  })
}
