export const getPathSegments = (pathname: string): string[] =>
  pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part))

export const getMetaContent = (property: string): string | undefined =>
  document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content
    || document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`)?.content

export const getTitle = (fallback = "GitHub"): string =>
  cleanTitle(getMetaContent("og:title") || document.title) || fallback

export const cleanTitle = (title: string | undefined): string => {
  if (!title) return ""

  return title
    .replace(/\s*\u00b7\s*GitHub\s*$/i, "")
    .replace(/\s*-\s*GitHub\s*$/i, "")
    .replace(/\s*\|\s*GitHub Blog\s*$/i, "")
    .trim()
}

export const createButton = (label: string, url: string): { label: string, url: string } => ({
  label,
  url: normalizeUrl(url).split("?")[0] || url,
})

export const getVisibleText = (selector: string): string | undefined =>
  document.querySelector(selector)?.textContent?.trim() || undefined

const normalizeUrl = (url: string): string => {
  if (url.startsWith("/")) return `${location.origin}${url}`
  return url
}
