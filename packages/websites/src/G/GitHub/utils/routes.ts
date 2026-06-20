import { getPathSegments } from "./dom"

const RESERVED_GITHUB_PATHS = new Set([
  "about",
  "account",
  "apps",
  "billing",
  "business",
  "codespaces",
  "collections",
  "contact",
  "customer-stories",
  "dashboard",
  "enterprise",
  "events",
  "explore",
  "features",
  "feed",
  "gist",
  "github-copilot",
  "issues",
  "join",
  "login",
  "marketplace",
  "mcp",
  "new",
  "notifications",
  "organizations",
  "orgs",
  "pricing",
  "pulls",
  "readme",
  "repositories",
  "repos",
  "search",
  "security",
  "settings",
  "signup",
  "site",
  "sponsors",
  "topics",
  "trending",
])

export const isGitHubReservedPath = (part: string): boolean => RESERVED_GITHUB_PATHS.has(part.toLowerCase())

export const getIssueSection = (pathname: string): string | undefined => {
  const section = getPathSegments(pathname)[1]
  if (section === "assigned") return "Assigned"
  if (section === "created") return "Created"
  if (section === "mentioned") return "Mentioned"
  if (section === "recent") return "Recent"
  return undefined
}

export const getGitHubFallbackDetails = (pathname: string): string => {
  if (pathname.startsWith("/pulls")) return "Checking pull requests"
  if (pathname.startsWith("/issues")) return "Checking issues"
  if (pathname.startsWith("/notifications")) return "Checking notifications"
  if (pathname.startsWith("/marketplace")) return "Browsing Marketplace"
  if (pathname.startsWith("/explore")) return "Exploring GitHub"
  if (pathname.startsWith("/settings")) return "Changing settings"
  if (pathname.startsWith("/search")) return "Searching GitHub"
  return "Browsing GitHub"
}