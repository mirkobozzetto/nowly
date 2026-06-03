const EXTENSIONS: Record<string, string> = {
  logo: ".png",
  icon: ".png",
  thumbnail: ".jpg",
};

export const ASSET_URL = (slug: string, type: string): string => {
  const ext = EXTENSIONS[type] ?? ".png";
  return `https://cdn.nowly.me/presences/${slug}/assets/${type}${ext}`;
};
