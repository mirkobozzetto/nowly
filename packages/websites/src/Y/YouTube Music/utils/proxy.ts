const DISCORD_IMAGE_KEY_MAX_LENGTH = 300

export const toDiscordImage = (imageUrl: string | undefined): string | undefined => {
  if (!imageUrl?.startsWith("https://")) return undefined
  return imageUrl.length <= DISCORD_IMAGE_KEY_MAX_LENGTH ? imageUrl : undefined
}
