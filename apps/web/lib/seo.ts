import type { Metadata } from "next";

export const SITE_URL = "https://nowly.me";
export const SITE_NAME = "Nowly";
export const DEFAULT_OG_IMAGE = "/og-image.gif";

export const DEFAULT_SEO = {
  title: "Nowly | Automatic Discord Rich Presence",
  description:
    "Automatically show what you're watching on YouTube, Twitch, Disney+, Apple TV+, Prime Video and more in your Discord Rich Presence.",
  keywords: [
    "Discord Rich Presence",
    "Discord Presence",
    "Discord Activity",
    "Discord Status",
    "Custom Discord Status",
    "Rich Presence Extension",

    "YouTube Discord Rich Presence",
    "Twitch Discord Rich Presence",
    "Disney Plus Discord Rich Presence",
    "Prime Video Discord Rich Presence",
    "Apple TV Discord Rich Presence",

    "Show YouTube on Discord",
    "Show Twitch on Discord",
    "Show Netflix on Discord",
    "Show Streaming Activity on Discord",

    "Discord Activity Extension",
    "Discord Browser Extension",
    "Browser Rich Presence",
    "Browser Activity Tracker",

    "PreMiD Alternative",
    "Alternative to PreMiD",
    "Better than PreMiD",

    "Discord RPC",
    "Discord Rich Presence Browser",
    "Discord Integration",

    "Nowly",
  ],
};

type SeoOptions = {
  title: string
  description: string
  path?: string
  keywords?: string[]
  image?: string
  type?: "website" | "article"
  noIndex?: boolean
};

export const absoluteUrl = (path = "/"): string => {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const createMetadata = ({
  title,
  description,
  path = "/",
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noIndex = false,
}: SeoOptions): Metadata => {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title: {
      absolute: resolvedTitle,
    },
    description,
    keywords: [...DEFAULT_SEO.keywords, ...keywords],
    alternates: {
      canonical: url,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: resolvedTitle,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
  };
};

export const jsonLd = (data: Record<string, unknown>): string => JSON.stringify(data).replace(/</g, "\\u003c");