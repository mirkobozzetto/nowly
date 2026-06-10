export const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    ".channel-root video",
    ".video-player video",
    ".persistent-player video",
    ".tw-full-screen video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}

export const isOnChannelPage = (): boolean => {
  const parts = location.pathname.replace(/\/$/, "").split("/").filter(Boolean)
  return (
    parts.length === 1 &&
    !["directory", "search", "downloads", "turbo", "jobs"].includes(parts[0]!)
  )
}

export const isOnVideoPage = (): boolean => location.pathname.includes("/videos/")

export const isOnClipPage = (): boolean =>
  location.hostname === "clips.twitch.tv" || location.pathname.includes("/clip/")
