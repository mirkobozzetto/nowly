const DISCORD_RICH_PRESENCE_SUFFIX = "-discord-rich-presence";
const RICH_PRESENCE_SUFFIX = "-rich-presence";

export const buildPresenceSeoPath = (slug: string): string => `/${slug}${DISCORD_RICH_PRESENCE_SUFFIX}`;

export const buildPresenceRichPresencePath = (slug: string): string => `/${slug}${RICH_PRESENCE_SUFFIX}`;

export const parsePresenceSeoSlug = (value: string): string | null => {
  const slug = value.toLowerCase();

  if (slug.endsWith(DISCORD_RICH_PRESENCE_SUFFIX)) {
    return slug.slice(0, -DISCORD_RICH_PRESENCE_SUFFIX.length);
  }

  if (slug.endsWith(RICH_PRESENCE_SUFFIX)) {
    return slug.slice(0, -RICH_PRESENCE_SUFFIX.length);
  }

  return null;
};