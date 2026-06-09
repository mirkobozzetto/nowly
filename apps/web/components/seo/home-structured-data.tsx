import { DEFAULT_SEO, SITE_NAME, SITE_URL } from "@/lib/seo";
import type { FC, ReactElement } from "react";
import { JsonLd } from "./json-ld";

export const HomeStructuredData: FC = (): ReactElement => (
  <>
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: DEFAULT_SEO.description,
      }}
    />

    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BrowserApplication",
        operatingSystem: "Windows, Chromium",
        url: SITE_URL,
        description: DEFAULT_SEO.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      }}
    />
  </>
);