import type { Metadata } from "next";
import type { FC, ReactElement } from "react";
import { CtaSection } from "@/components/home/cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { PlatformsSection } from "@/components/home/platforms-section";
import { StepsSection } from "@/components/home/steps-section";

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

const HomePage: FC = (): ReactElement => {
  return (
    <main>
      <HeroSection />
      <PlatformsSection />
      <StepsSection />
      <CtaSection />
    </main>
  );
};

export { generateMetadata };
export default HomePage;
