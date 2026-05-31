import { CtaSection } from "@/components/home/cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { PlatformsSection } from "@/components/home/platforms-section";
import { StepsSection } from "@/components/home/steps-section";
import type { FC, ReactElement } from "react";

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

export default HomePage;
