import type { PresenceContext, PresenceFactory } from "../../types.js"

const presence: PresenceFactory = {
  init(ctx: PresenceContext) {
    const video = document.querySelector<HTMLVideoElement>(".video-stream")
    if (!video) return

    const title = document
      .querySelector("h1 yt-formatted-string")
      ?.textContent?.trim() || "YouTube"

      const uploader = document
      .querySelector("#owner yt-formatted-string a")
      ?.textContent?.trim() || ""

    const videoId = new URLSearchParams(window.location.search).get("v")
    const thumbnail = videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : undefined

    ctx.setActivity({
      details: title,
      state: uploader,
      largeImageKey: thumbnail,
      largeImageText: title,
      smallImageKey: "youtube",
      smallImageText: "YouTube",
      startTimestamp: Date.now(),
      buttons: [{ label: "Watch Video", url: window.location.href.split("&")[0] }]
    })
  },

  tick(ctx: PresenceContext) {
    const video = document.querySelector<HTMLVideoElement>(".video-stream")
    if (!video) {
      ctx.clearActivity()
      return
    }

    if (video.paused) {
      ctx.clearActivity()
      return
    }

    const title = document
      .querySelector("h1 yt-formatted-string")
      ?.textContent?.trim() || "YouTube"
    
    const uploader = document
      .querySelector("#owner yt-formatted-string a")
      ?.textContent?.trim() || ""

    ctx.setActivity({
      details: title,
      state: uploader,
      largeImageKey: `https://img.youtube.com/vi/${new URLSearchParams(window.location.search).get("v")}/maxresdefault.jpg`,
      largeImageText: title,
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
