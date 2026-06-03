export const PAGE_WORLD_EVENT = "__yt_presence_bridge__"

export const queryPageWorld = (expectedVideoId?: string): Promise<{ author?: string; title?: string; videoId?: string }> =>
  new Promise((resolve) => {
    try {
      const players = Array.from(document.querySelectorAll("#shorts-player, #movie_player, .html5-video-player")) as Array<HTMLElement & {
        getPlayerResponse?: () => { videoDetails?: { author?: string; title?: string; videoId?: string } }
      }>

      for (const player of players) {
        const details = player.getPlayerResponse?.()?.videoDetails
        if (details?.videoId && (!expectedVideoId || details.videoId === expectedVideoId)) {
          resolve({
            author: details.author,
            title: details.title,
            videoId: details.videoId,
          })
          return
        }
      }
    } catch {}

    const onEvent = (event: Event) => {
      document.removeEventListener(PAGE_WORLD_EVENT, onEvent)
      const detail = (event as CustomEvent).detail as { author?: string; title?: string; videoId?: string }
      resolve(detail ?? {})
    }

    document.addEventListener(PAGE_WORLD_EVENT, onEvent, { once: true })

    const script = document.createElement("script")
    script.textContent = `(function() {
      try {
        var expectedVideoId = ${JSON.stringify(expectedVideoId || "")};
        var players = Array.prototype.slice.call(document.querySelectorAll("#shorts-player, #movie_player, .html5-video-player"));
        var author = "";
        var title = "";
        var videoId = "";

        for (var i = 0; i < players.length; i++) {
          var player = players[i];
          var response = player && typeof player.getPlayerResponse === "function" ? player.getPlayerResponse() : null;
          var details = response && response.videoDetails ? response.videoDetails : null;
          var nextVideoId = details && details.videoId ? details.videoId : "";
          if (details && (!expectedVideoId || nextVideoId === expectedVideoId)) {
            author = details.author || "";
            title = details.title || "";
            videoId = nextVideoId;
            break;
          }
        }

        if ((!author || !title || !videoId) && window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.videoDetails) {
          var initialDetails = window.ytInitialPlayerResponse.videoDetails;
          author = author || initialDetails.author || "";
          title = title || initialDetails.title || "";
          videoId = videoId || initialDetails.videoId || "";
        }

        document.dispatchEvent(new CustomEvent(${JSON.stringify(PAGE_WORLD_EVENT)}, {
          detail: {
            author: author || undefined,
            title: title || undefined,
            videoId: videoId || undefined,
            matched: !expectedVideoId || videoId === expectedVideoId
          }
        }));
      } catch {
        document.dispatchEvent(new CustomEvent(${JSON.stringify(PAGE_WORLD_EVENT)}, { detail: {} }));
      }
    })();`

    ;(document.head || document.documentElement).appendChild(script)
    script.remove()

    setTimeout(() => {
      document.removeEventListener(PAGE_WORLD_EVENT, onEvent)
      resolve({})
    }, 800)
  })
