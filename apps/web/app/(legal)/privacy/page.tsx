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
    title: "Privacy Policy — Nowly",
    description: "Privacy Policy for Nowly. Learn how your data is processed locally and what information is collected.",
    openGraph: {
      title: "Privacy Policy — Nowly",
      description: "Privacy Policy for Nowly. Learn how your data is processed locally and what information is collected.",
    },
  };
};

const Page = (): ReactElement => {
  const t = useTranslations("PrivacyPage");
  const sections = t.raw("sections") as PageSection[];

  const items = sections.map((section) => ({
    title: section.title,
    description: section.body,
  }));

  return (
    <StructuredContentPage
      title={t("title")}
      lastUpdated={t("lastUpdated")}
      intro={t.raw("intro") as string}
      items={items}
    />
  );
};

export { generateMetadata };

export default Page;