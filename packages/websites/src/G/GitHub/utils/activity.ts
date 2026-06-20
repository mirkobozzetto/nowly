import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { getPathSegments } from "./dom"
import { handleDashboardPage } from "./dashboards"
import { handleDiscoveryPage } from "./discovery"
import { handleMcpPage } from "./mcp"
import { handleProductPage } from "./products"
import { handleProfilePage } from "./profiles"
import { getGitHubFallbackDetails, isGitHubReservedPath } from "./routes"
import { handleRepositoryPage } from "./repositories"

export const handleGitHub = async (
  presence: PresenceInstance,
  pathname: string,
  search: string,
  href: string,
  showPrivateRepositories: boolean,
): Promise<void> => {
  const [first, second] = getPathSegments(pathname)

  if (await handleDashboardPage(presence, pathname, search)) return
  if (await handleDiscoveryPage(presence, pathname, href)) return
  if (await handleMcpPage(presence, pathname, href)) return
  if (await handleProductPage(presence, pathname)) return

  if (first && second && !isGitHubReservedPath(first)) {
    const handled = await handleRepositoryPage(presence, pathname, href, first, second, showPrivateRepositories)
    if (handled) return
  }

  if (first && !second && !isGitHubReservedPath(first)) {
    await handleProfilePage(presence, first, href)
    return
  }

  await presence.setActivity({
    details: getGitHubFallbackDetails(pathname),
    largeImageKey: Assets.Logo,
    largeImageText: "GitHub",
    type: PresenceType.Watching,
  })
}
