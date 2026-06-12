import { StructuredContentPage } from "@/components/layout/structured-content-page";
import { FaqStructuredData } from "@/components/seo/faq-structured-data";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type FaqItem = {
  question: string
  answer: string
};

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Nowly FAQ",
    description: "Frequently asked questions about the Nowly Discord Rich Presence browser extension, installation, supported platforms and privacy.",
    path: "/faq",
  });
};

const Page = (): ReactElement => {
  const t = useTranslations("FaqPage");
  const items = t.raw("items") as FaqItem[];
  const faqItems = items.map((item) => ({
    question: item.question,
    answer: item.answer.replace(/<[^>]*>/g, ""),
  }));
  const contentItems = items.map((item) => ({
    title: item.question,
    description: item.answer,
  }));

  return (
    <StructuredContentPage title={t("title")} items={contentItems}>
      <FaqStructuredData items={faqItems} />
    </StructuredContentPage>
  );
};

export { generateMetadata };

export default Page;
