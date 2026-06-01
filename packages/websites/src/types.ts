export type { PresenceData } from "@nowly/presence";
export { PresenceType } from "@nowly/presence";

import type { PresenceData } from "@nowly/presence";

export interface PresenceContext {
  setActivity(data: PresenceData): void;
  clearActivity(): void;
  storage: Map<string, unknown>;
}

export interface PresenceFactory {
  init(ctx: PresenceContext): void;
  tick?(ctx: PresenceContext): void;
  destroy?(): void;
}

export type PlatformStatus = "available" | "soon" | "beta";

export interface Metadata {
  slug?: string;
  name: string;
  version?: string;
  author: { name: string; github?: string };
  contributors?: { name: string; github?: string }[];
  description: Record<string, string>;
  longDescription?: Record<string, string>;
  url: string[];
  regExp?: string;
  color: string;
  category: "streaming" | "music" | "tv" | "anime" | "other";
  tags: string[];
  features?: Record<string, string[]>;
  assets: {
    logo: string;
    icon: string;
    thumbnail: string;
  }
}
