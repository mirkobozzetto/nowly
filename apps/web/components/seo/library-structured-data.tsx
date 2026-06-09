import { SITE_URL } from "@/lib/seo";
import type { FC, ReactElement } from "react";
import { JsonLd } from "./json-ld";

export const LibraryStructuredData: FC = (): ReactElement => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Discord Rich Presence Library",
      url: `${SITE_URL}/library`,
      description: "Browse Nowly presences for supported websites and streaming platforms.",
    }}
  />
);