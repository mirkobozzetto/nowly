let cached: { url: string; video: HTMLVideoElement } | null = null

export const getVideo = (video: HTMLVideoElement | null): HTMLVideoElement | null => {
  if (cached?.video && !document.contains(cached.video)) {
    cached = null
  }

  const url = video?.src
  if (url && (!cached || cached.url !== url)) {
    cached = { url, video }
  } else if (!video && cached?.video) {
    return cached.video
  }

  return video || cached?.video || null
}

export const findPlayingVideo = (): HTMLVideoElement | undefined =>
  Array.from(document.querySelectorAll("video")).find(video => !video.paused)

export const timestampFromFormat = (str: string): number =>
  str
    .split(":")
    .map(Number)
    .reverse()
    .reduce((total, value, index) => total + value * 60 ** index, 0)

export const getVideoState = (
  video: HTMLVideoElement | null,
): { paused: boolean; currentTime: number; duration: number } => {
  if (video) {
    return {
      paused: video.paused,
      currentTime: video.currentTime,
      duration: video.duration,
    }
  }

  const timeContainer = document.querySelector("[class*=\"DivSeekBarTimeContainer\"]")?.textContent
  const timeParts = timeContainer?.split("/") ?? []

  return {
    paused: false,
    currentTime: timeParts[0] ? timestampFromFormat(timeParts[0]) : 0,
    duration: timeParts[1] ? timestampFromFormat(timeParts[1]) : 0,
  }
}
