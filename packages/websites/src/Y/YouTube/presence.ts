import type { PresenceContext, PresenceFactory } from "../../types.js"

const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    [".video-stream", "class .video-stream"],
    ["video.html5-main-video", "class html5-main-video"],
    ["#movie_player video", "#movie_player video"],
    ["#player-container video", "#player-container video"],
    ["#player video", "#player video"],
    ["video", "any <video>"],
  ] as const
  for (const [sel, label] of selectors) {
    const el = document.querySelector<HTMLVideoElement>(sel)
    if (el) {
      console.log("[Presence YouTube] findVideo found via:", label, el.readyState, el.paused)
      return el
    }
    console.log("[Presence YouTube] findVideo miss:", label)
  }
  for (const root of document.querySelectorAll("ytd-player, ytd-watch-flexy")) {
    const el = root.shadowRoot?.querySelector<HTMLVideoElement>("video")
    if (el) {
      console.log("[Presence YouTube] findVideo found via Shadow DOM:", el)
      return el
    }
    console.log("[Presence YouTube] findVideo Shadow DOM miss:", root.tagName, !!root.shadowRoot)
  }
  return null
}

const findTitle = (): string => {
  const t = document.querySelector("h1 yt-formatted-string")?.textContent?.trim()
    || document.querySelector("h1")?.textContent?.trim()
    || document.title.replace(" - YouTube", "")
    || "YouTube"
  console.log("[Presence YouTube] findTitle:", t)
  return t
}

const findUploader = (): string => {
  const u = document.querySelector("#owner yt-formatted-string a")?.textContent?.trim()
    || document.querySelector(".ytd-channel-name a")?.textContent?.trim()
    || document.querySelector("#owner-container a")?.textContent?.trim()
    || ""
  console.log("[Presence YouTube] findUploader:", u)
  return u
}

const presence: PresenceFactory = {
  init(ctx: PresenceContext) {
    const video = findVideo()
    if (!video) return

    const videoId = new URLSearchParams(window.location.search).get("v")
    const thumbnail = videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : undefined

    ctx.setActivity({
      details: findTitle(),
      state: findUploader(),
      largeImageKey: thumbnail,
      largeImageText: findTitle(),
      smallImageKey: "youtube",
      smallImageText: "YouTube",
      startTimestamp: Date.now(),
      buttons: [{ label: "Watch Video", url: window.location.href.split("&")[0] }]
    })
  },

  tick(ctx: PresenceContext) {
    const video = findVideo()
    if (!video) {
      ctx.clearActivity()
      return
    }

    if (video.paused) {
      ctx.clearActivity()
      return
    }

    ctx.setActivity({
      details: findTitle(),
      state: findUploader(),
      largeImageKey: `https://img.youtube.com/vi/${new URLSearchParams(window.location.search).get("v")}/maxresdefault.jpg`,
      largeImageText: findTitle(),
      smallImageKey: "youtube",
      smallImageText: "YouTube",
      startTimestamp: Date.now(),
      buttons: [{ label: "Watch Video", url: window.location.href.split("&")[0] }],
    })
  },

  destroy() {
    // cleanup if needed
  },
}

export default presence
