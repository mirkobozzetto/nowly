import { MarketplaceClient } from "@/components/library/marketplace-client";
import type { Metadata } from "next";
import type { FC, ReactElement } from "react";

const generateMetadata = (): Metadata => {
  return {
    title: "Presence Library — Nowly",
    description: "Browse and install presences for YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    openGraph: {
      title: "Presence Library — Nowly",
      description: "Browse and install presences for YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    },
    twitter: {
      title: "Presence Library — Nowly",
      description: "Browse and install presences for YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    },
  };
};

const Page: FC = (): ReactElement => {
  return <MarketplaceClient />;
};

export { generateMetadata };
export default Page;