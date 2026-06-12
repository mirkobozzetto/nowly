import { AdSection } from "@/components/home/ad-section";
import { CtaSection } from "@/components/home/cta-section";
import { FaqSection } from "@/components/home/faq-section";
import { HeroSection } from "@/components/home/hero-section";
import { PresencesSection } from "@/components/home/presences-section";
import { StepsSection } from "@/components/home/steps-section";
import { HomeStructuredData } from "@/components/seo/home-structured-data";
import { DEFAULT_SEO, createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import type { FC, ReactElement } from "react";

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    path: "/",
  });
};

const Page: FC = (): ReactElement => {
  return (
    <main>
      <HomeStructuredData />
      <HeroSection />
      <PresencesSection />
      <AdSection />
      <StepsSection />
      <FaqSection />
      <CtaSection />
    </main>
  );
};

export { generateMetadata };

export default Page;