import type { Platform } from "./platforms";

export function getLocalizedDescription(platform: Platform, locale: string): string {
  return platform.localized?.description?.[locale] ?? platform.description;
}

export function getLocalizedLongDescription(platform: Platform, locale: string): string {
  return platform.localized?.longDescription?.[locale] ?? platform.longDescription;
}

export function getLocalizedFeatures(platform: Platform, locale: string): string[] {
  return platform.localized?.features?.[locale] ?? platform.features;
}
