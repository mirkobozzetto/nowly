/// <reference types="vite/client" />

declare module "@/generated/bundled-presences" {
  import type { PresenceRelease } from "@/shared/types"

  export interface BundledPresence {
    slug: string
    release: PresenceRelease
  }

  export const BUNDLED_PRESENCES: BundledPresence[]
}