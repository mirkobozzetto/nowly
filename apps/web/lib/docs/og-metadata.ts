type DocOgMetadata = {
  title: string
  description: string
  category: string
};

const DOCS_OG_METADATA: Record<string, DocOgMetadata> = {
  "getting-started": {
    title: "Getting Started",
    description: "Install Nowly, connect the native host, and start showing your activity in Discord Rich Presence.",
    category: "Getting Started",
  },
};

export const getDocOgMetadata = (slug: string): DocOgMetadata | null => DOCS_OG_METADATA[slug] ?? null;