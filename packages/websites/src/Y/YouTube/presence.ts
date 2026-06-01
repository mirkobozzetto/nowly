import { createMediaTimestamps, PresenceType } from "@nowly/presence"

const presence = new Presence()

const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    ".video-stream",
    "video.html5-main-video",
    "#movie_player video",
    "#player-container video",
    "#player video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  for (const root of document.querySelectorAll("ytd-player, ytd-watch-flexy")) {
    const video = root.shadowRoot?.querySelector<HTMLVideoElement>("video")
    if (video) return video
  }

  return null
}

const findTitle = (): string =>
  document.querySelector("h1 yt-formatted-string")?.textContent?.trim()
  || document.querySelector("h1")?.textContent?.trim()
  || document.title.replace(" - YouTube", "")
  || "YouTube"

const findUploader = (): string =>
  document.querySelector("#owner yt-formatted-string a")?.textContent?.trim()
  || document.querySelector(".ytd-channel-name a")?.textContent?.trim()
  || document.querySelector("#owner-container a")?.textContent?.trim()
  || "YouTube"

presence.on("UpdateData", async () => {
  const video = findVideo()
  const videoId = new URLSearchParams(window.location.search).get("v")

  if (!video || !videoId) {
    presence.clearActivity()
    return
  }

  const title = findTitle()
  const isPlaying = !video.paused

  await presence.setActivity({
    details: title,
    state: findUploader(),
    largeImageKey: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined,
    largeImageText: title,
    smallImageKey: isPlaying ? "play" : "pause",
    smallImageText: isPlaying ? "Playing" : "Paused",
    ...createMediaTimestamps(video),
    type: PresenceType.Watching,
    buttons: [{ label: "Watch Video", url: window.location.href.split("&")[0] }],
  })
})
