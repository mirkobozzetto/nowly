import { PresenceType, type PresenceInstance } from "@nowly/presence"
import { createButton, getPathSegments, getTitle } from "./dom"
import { getAvatarImage, toDiscordImage } from "./images"

export type RepositoryInfo = {
  owner: string
  repo: string
  name: string
}

export const handleRepositoryPage = async (
  presence: PresenceInstance,
  pathname: string,
  owner: string,
  repo: string,
  showPrivateRepositories: boolean,
): Promise<boolean> => {
  const repository = getRepositoryInfo(owner, repo)
  if (!repository) return false

  const isPrivate = isPrivateRepository()
  if (isPrivate && !showPrivateRepositories) {
    presence.clearActivity()
    return true
  }

  const image = await toDiscordImage(getAvatarImage(owner))
  const section = getRepositorySection(pathname)

  await presence.setActivity({
    details: getRepositoryDetails(section),
    state: repository.name,
    largeImageKey: image || Assets.Logo,
    largeImageText: repository.name,
    type: PresenceType.Watching,
    buttons: isPrivate ? undefined : [createButton("View repository", `https://github.com/${repository.owner}/${repository.repo}`)],
  })

  return true
}

export const getRepositoryInfo = (owner: string, repo: string): RepositoryInfo | undefined => {
  const nwo = document.querySelector<HTMLMetaElement>('meta[name="octolytics-dimension-repository_nwo"]')?.content
  const fromMeta = nwo?.match(/^([^/]+)\/([^/]+)$/)
  if (fromMeta) return createRepositoryInfo(fromMeta[1], fromMeta[2])

  const title = getTitle()
  const fromTitle = title.match(/^([^/\s]+)\s*\/\s*([^\s:]+)(?:\s*:\s*)?/)
  if (fromTitle && equalsIgnoreCase(fromTitle[1], owner) && equalsIgnoreCase(fromTitle[2], repo)) {
    return createRepositoryInfo(fromTitle[1], fromTitle[2])
  }

  return createRepositoryInfo(owner, repo)
}

export const isPrivateRepository = (): boolean => {
  const publicMeta = document.querySelector<HTMLMetaElement>('meta[name="octolytics-dimension-repository_public"]')?.content
  if (publicMeta === "false") return true
  if (publicMeta === "true") return false

  const candidates = [
    document.querySelector('[title="Private"]')?.textContent,
    document.querySelector('[aria-label="Private repository"]')?.textContent,
    document.querySelector('[data-testid="repository-visibility-label"]')?.textContent,
    document.querySelector(".Label")?.textContent,
  ]

  return candidates.some((candidate) => candidate?.trim().toLowerCase() === "private")
}

export const getRepositorySection = (pathname: string): string | undefined => {
  const [, , section] = getPathSegments(pathname)

  if (!section) return "Code"
  if (section === "issues") return "Issues"
  if (section === "pulls") return "Pull requests"
  if (section === "actions") return "Actions"
  if (section === "projects") return "Projects"
  if (section === "security") return "Security"
  if (section === "pulse") return "Pulse"
  if (section === "graphs") return "Insights"
  if (section === "wiki") return "Wiki"
  if (section === "discussions") return "Discussions"
  if (section === "releases") return "Releases"
  if (section === "packages") return "Packages"
  if (section === "settings") return "Repository settings"
  if (section === "blob") return "Viewing a file"
  if (section === "tree") return "Browsing files"
  if (section === "edit") return "Editing a file"
  if (section === "commit") return "Viewing a commit"
  if (section === "commits") return "Viewing commits"
  if (section === "compare") return "Comparing changes"
  if (section === "milestones") return "Milestones"

  return titleCase(section.replace(/-/g, " "))
}

const createRepositoryInfo = (owner: string, repo: string): RepositoryInfo => ({
  owner,
  repo,
  name: `${owner}/${repo}`,
})

const getRepositoryDetails = (section: string | undefined): string => {
  if (!section || section === "Code") return "Browsing repository"
  return `Browsing repository [${section}]`
}

const equalsIgnoreCase = (a: string, b: string): boolean => a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0

const titleCase = (value: string): string => value.replace(/\b\w/g, (letter) => letter.toUpperCase())