export const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    ".watch-video video",
    "#appMountPoint video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}