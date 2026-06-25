import type { PresenceCategory } from "./categories";

export type PresenceStatus = "available" | "soon" | "beta";
export type { PresenceCategory };

export interface Contributor {
  name: string
  github?: string
  avatar?: string
}

export interface Presence {
  id: string
  slug: string
  name: string
  description: string
  longDescription: string
  icon: string
  iconColor: string
  category: PresenceCategory
  status: PresenceStatus
  version: string | null
  activeUsers: number
  totalInstalls: number
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