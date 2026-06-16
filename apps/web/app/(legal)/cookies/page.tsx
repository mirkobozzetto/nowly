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
    title: "Cookie Policy — Nowly",
    description: "How Nowly uses cookies on nowly.me. No tracking or advertising cookies are placed.",
    openGraph: {
      title: "Cookie Policy — Nowly",
      description: "How Nowly uses cookies on nowly.me. No tracking or advertising cookies are placed.",
    },
  };
};

const Page = (): ReactElement => {
  const t = useTranslations("cookies-page");
  const sections = t.raw("sections") as PageSection[];
  const items = sections.map((section) => ({
    title: section.title,
    description: section.body,
  }));

  return (
    <StructuredContentPage
      title={t("title")}
      lastUpdated={t("last-updated")}
      intro={t.raw("intro") as string}
      items={items}
    />
  );
};

export { generateMetadata };

export default Page;