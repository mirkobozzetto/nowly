import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

export const FooterLinks: FC = () => {
  const t = useTranslations("Footer");

  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <Link href="/faq" className="hover:text-foreground transition-colors">
        {t("faq")}
      </Link>
      <span className="opacity-30">·</span>
      <Link href="/changelog" className="hover:text-foreground transition-colors">
        {t("changelog")}
      </Link>
      <span className="opacity-30">·</span>
      <Link href="/privacy" className="hover:text-foreground transition-colors">
        {t("privacy")}
      </Link>
      <span className="opacity-30">·</span>
      <Link href="/tos" className="hover:text-foreground transition-colors">
        {t("tos")}
      </Link>
    </div>
  );
};
