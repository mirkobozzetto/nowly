import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { getTitle } from "./dom"

const ProductAssets = Presence.Assets({
  CopilotLogo: "/products/copilot_logo.png",
  SparkLogo: "/products/spark_logo.png",
  McpLogo: "/products/mcp_logo.png",
  GitHubNextLogo: "/products/githubnext_logo.png",
  UniverseLogo: "/products/universe_logo.png",
})

export { ProductAssets }

export const handleProductPage = async (
  presence: PresenceInstance,
  pathname: string,
): Promise<boolean> => {
  if (pathname === "/copilot" || pathname.startsWith("/copilot/")) {
    await presence.setActivity({
      details: "Using GitHub Copilot",
      state: getTitle("GitHub Copilot"),
      largeImageKey: ProductAssets.CopilotLogo,
      largeImageText: "GitHub Copilot",
      type: PresenceType.Watching,
    })
    return true
  }

  if (pathname === "/spark" || pathname.startsWith("/spark/")) {
    await presence.setActivity({
      details: "Exploring GitHub Spark",
      state: getTitle("GitHub Spark"),
      largeImageKey: ProductAssets.SparkLogo,
      largeImageText: "GitHub Spark",
      type: PresenceType.Watching,
    })
    return true
  }

  return false
}
