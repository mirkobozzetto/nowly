import { CardDescription, CardTitle } from "@/components/l-ui/card";
import { useTranslations } from "next-intl";
import type { FC } from "react";

type Props = {
  description: string
};

export const PlatformHeaderAbout: FC<Props> = ({ description }) => {
  const t = useTranslations("MarketplaceDetail");

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <CardTitle>{t("about")}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </div>
  );
};
