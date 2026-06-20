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
  const [, , section, subSection, extraSection] = getPathSegments(pathname)

  if (!section) return "Code"
  if (section === "issues") return getIssueSection(subSection)
  if (section === "pulls" || section === "pull") return getPullRequestSection(subSection, extraSection)
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
  if (section === "compare") return "Creating a pull request"
  if (section === "milestones") return "Milestones"
  if (section === "labels") return "Labels"
  if (section === "branches") return "Branches"
  if (section === "tags") return "Tags"
  if (section === "forks") return "Forks"

  return titleCase(section.replace(/-/g, " "))
}

const createRepositoryInfo = (owner: string, repo: string): RepositoryInfo => ({
  owner,
  repo,
  name: `${owner}/${repo}`,
})

const getRepositoryDetails = (section: string | undefined): string => {
  if (!section || section === "Code") return "Browsing repository"

  const repositorySectionDetails: Record<string, string> = {
    "Issues": "Viewing repository issues",
    "Pull requests": "Viewing repository pull requests",
    "Actions": "Viewing repository actions",
    "Projects": "Viewing repository projects",
    "Security": "Viewing repository security",
    "Pulse": "Viewing repository pulse",
    "Insights": "Viewing repository insights",
    "Wiki": "Viewing repository wiki",
    "Discussions": "Viewing repository discussions",
    "Releases": "Viewing repository releases",
    "Packages": "Viewing repository packages",
    "Repository settings": "Viewing repository settings",
    "Milestones": "Viewing repository milestones",
    "Labels": "Viewing repository labels",
    "Branches": "Viewing repository branches",
    "Tags": "Viewing repository tags",
    "Forks": "Viewing repository forks",
  }

  return repositorySectionDetails[section] || section
}

const getIssueSection = (issuePath: string | undefined): string => {
  if (!issuePath) return "Issues"
  if (issuePath === "new") return "Creating an issue"
  if (issuePath === "templates" || issuePath === "choose") return "Choosing an issue template"
  if (issuePath === "assigned") return "Assigned issues"
  if (issuePath === "created_by") return "Created issues"
  if (/^\d+$/.test(issuePath)) return `Viewing issue #${issuePath}`
  return "Issues"
}

const getPullRequestSection = (
  pullPath: string | undefined,
  viewPath: string | undefined,
): string => {
  if (!pullPath) return "Pull requests"
  if (/^\d+$/.test(pullPath)) return getPullRequestView(pullPath, viewPath)
  return "Pull requests"
}

const getPullRequestView = (pullNumber: string, viewPath: string | undefined): string => {
  if (viewPath === "changes" || viewPath === "files") return `Reviewing changes in pull request #${pullNumber}`
  if (viewPath === "commits") return `Viewing commits in pull request #${pullNumber}`
  if (viewPath === "checks") return `Viewing checks in pull request #${pullNumber}`
  return `Viewing pull request #${pullNumber}`
}

const equalsIgnoreCase = (a: string, b: string): boolean => a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0

const titleCase = (value: string): string => value.replace(/\b\w/g, (letter) => letter.toUpperCase())