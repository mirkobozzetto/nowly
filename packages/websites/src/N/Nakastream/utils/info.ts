import { normalizePosterUrl } from "./posters"

export const getNakastreamInfo = () => {
  const params = new URLSearchParams(location.search)
  const title =
    params.get("title") ||
    document.querySelector("span.nk-title")?.textContent?.trim() ||
    null
  const type = params.get("type")
  const id = params.get("id")
  const season = params.get("season") ?? params.get("s")
  const ep = params.get("episode") ?? params.get("ep") ?? params.get("e")
  const episodeTitle =
    params.get("ep_title") ??
    params.get("episode_title") ??
    params.get("etitle") ??
    null

  return {
    title,
    contentType: type === "movie" ? "movie" : "tv",
    id,
    poster: normalizePosterUrl(params.get("poster")),
    season: season ? Number(season) : null,
    episodeNum: ep ? Number(ep) : null,
    episodeTitle,
  }
}

export const formatEpisodeState = (info: ReturnType<typeof getNakastreamInfo>): string | undefined => {
  if (info.contentType === "tv" && info.season != null && info.episodeNum != null) {
    const episode = `S${info.season}.E${info.episodeNum}`
    return info.episodeTitle ? `${episode} ${info.episodeTitle}` : episode
  }

  return info.episodeTitle || undefined
}
