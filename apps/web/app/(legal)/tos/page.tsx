import { StructuredContentPage } from "@/components/layout/structured-content-page";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type PageSection = {
  title: string
  body: string
};

const generateMetadata = (): Metadata => {
  return {
    title: "Terms of Service — Nowly",
    description: "Terms of Service for Nowly. Please read before using the browser extension, native application and website.",
    openGraph: {
      title: "Terms of Service — Nowly",
      description: "Terms of Service for Nowly. Please read before using the browser extension, native application and website.",
    },
  };
};

const Page = (): ReactElement => {
  const t = useTranslations("tos-page");
  const sections = t.raw("sections") as PageSection[];
  const items = sections.map((section) => ({
    title: section.title,
    description: section.body,
  }));

  return (
    <StructuredContentPage
      title={t("title")}
      lastUpdated={t("last-updated")}
      items={items}
    />
  );
};

export { generateMetadata };
export default Page;
