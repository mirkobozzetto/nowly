import { routing } from "@/i18n/routing";
import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => {
  const baseUrl = "https://nowly.me";

  const staticPages = [
    "",
    "/changelog",
    "/faq",
    "/library",
    "/privacy",
    "/tos",
  ];

  return routing.locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? "weekly" as const : "monthly" as const,
      priority: page === "" ? 1 : 0.8,
    }))
  );
};

export default sitemap;