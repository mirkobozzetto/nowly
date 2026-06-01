export type PlatformCategory = "streaming" | "music" | "tv" | "anime" | "other";
export type PlatformStatus = "available" | "soon" | "beta";

export interface Contributor {
  name: string
  github?: string
  avatar?: string
}

export interface Platform {
  id: string
  slug: string
  name: string
  description: string
  longDescription: string
  icon: string
  iconColor: string
  category: PlatformCategory
  status: PlatformStatus
  version: string | null
  activeUsers: number
  totalInstalls: number
  rating: number
  addedAt: string
  lastUpdated: string
  supportedUrls: string[]
  author: Contributor
  contributors: Contributor[]
  features: string[]
  settings?: Record<string, unknown>
  localized?: {
    description?: Record<string, string>
    longDescription?: Record<string, string>
    features?: Record<string, string[]>
  }
}

export const categories: { value: PlatformCategory; label: string }[] = [
  { value: "streaming", label: "Streaming" },
  { value: "music", label: "Music" },
  { value: "tv", label: "TV & Films" },
  { value: "anime", label: "Anime" },
  { value: "other", label: "Other" },
];
