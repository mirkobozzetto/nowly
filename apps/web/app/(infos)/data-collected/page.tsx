import { StructuredContentPage } from "@/components/layout/structured-content-page";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type PageSection = {
  title: string
  body: string
};

const generateMetadata = (): Metadata => createMetadata({
  title: "Data collected by Nowly analytics",
  description: "See what Nowly collects when anonymous analytics are enabled, and what it never collects.",
  path: "/data-collected",
});

const Page = (): ReactElement => {
  const t = useTranslations("data-collected-page");
  const sections = t.raw("sections") as PageSection[];

  return (
    <StructuredContentPage
      badge={t("badge")}
      title={t("title")}
      description={t("description")}
      intro={t.raw("intro") as string}
      items={sections.map((section) => ({
        title: section.title,
        description: section.body,
      }))}
      showAnchorLinks
    />
  );
};

export { generateMetadata };

export default Page;