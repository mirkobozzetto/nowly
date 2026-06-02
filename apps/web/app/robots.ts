import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: "https://nowly.me/sitemap.xml",
  };
};

export default robots;