import type { Presence } from "./presences";

export function getLocalizedDescription(platform: Presence, locale: string): string {
  return platform.localized?.description?.[locale] ?? platform.description;
}

export function getLocalizedLongDescription(platform: Presence, locale: string): string {
  return platform.localized?.longDescription?.[locale] ?? platform.longDescription;
}

export function getLocalizedFeatures(platform: Presence, locale: string): string[] {
  return platform.localized?.features?.[locale] ?? platform.features;
}
