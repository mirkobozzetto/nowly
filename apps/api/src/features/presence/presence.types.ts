export interface PresenceStats {
  totalInstalls: number
  activeUsers: number
  rating: number
  ratingCount: number
  ratingDistribution: Record<number, number>
  version: string | null
  addedAt: string | null
  lastUpdated: string | null
}

export interface GlobalPresenceStats {
  totalUsers: number
  activeUsers: number
  activePresenceCount: number
  installedPresenceCount: number
}

export interface VersionEntry {
  version: string
  changelog: string
  author: string
  authorGithub?: string
  releaseAuthor?: string
  releaseContributors?: string
  pr?: string
  source?: "cli" | "pr"
  commitSha?: string
  changedFiles?: string
  bundleSizeBytes?: number
  bundleSizeLabel?: string
  bundleSha256?: string
  versionType?: string
  aiGeneratedChangelog?: boolean
  createdAt?: string
  timestamp: number
}

export interface CommentEntry {
  id: string
  rating: number
  comment?: string
  authorId?: string
  authorName?: string
  authorAvatar?: string
  anonymous?: boolean
  createdAt: string
  isOwn?: boolean
}

export type PresenceMeta = Record<string, any>