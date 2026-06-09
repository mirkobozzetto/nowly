import { jsonLd } from "@/lib/seo";
import type { FC, ReactElement } from "react";

type Props = {
  data: Record<string, unknown>
};

export const JsonLd: FC<Props> = ({ data }): ReactElement => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
  />
);