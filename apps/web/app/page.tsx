import { AdSection } from "@/components/home/ad-section";
import { CtaSection } from "@/components/home/cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { PresencesSection } from "@/components/home/presences-section";
import { StepsSection } from "@/components/home/steps-section";
import type { Metadata } from "next";
import type { FC, ReactElement } from "react";

const generateMetadata = (): Metadata => {
  return {
    title: "Nowly | Automatic Discord Rich Presence",
    description: "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    openGraph: {
      title: "Nowly | Automatic Discord Rich Presence",
      description: "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    },
    twitter: {
      title: "Nowly | Automatic Discord Rich Presence",
      description: "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    },
  };
};

const Page: FC = (): ReactElement => {
  return (
    <main>
      <HeroSection />
      <PresencesSection />
      <AdSection />
      <StepsSection />
      <CtaSection />
    </main>
  );
};

export { generateMetadata };

export default Page;