import { SITE_URL } from "@/lib/seo";
import type { FC, ReactElement } from "react";
import { JsonLd } from "./json-ld";

type Props = {
  items: {
    question: string
    answer: string
  }[]
};

export const FaqStructuredData: FC<Props> = ({ items }): ReactElement => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      url: `${SITE_URL}/faq`,
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    }}
  />
);