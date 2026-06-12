import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

export const FooterLinks: FC = () => {
  const t = useTranslations("Footer");

  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <Link href="/about" className="hover:text-foreground transition-colors">
        {t("about")}
      </Link>

      <Link href="/faq" className="hover:text-foreground transition-colors">
        {t("faq")}
      </Link>

      <Link href="/status" className="hover:text-foreground transition-colors">
        {t("status")}
      </Link>

      <Link href="/docs/changelog" className="hover:text-foreground transition-colors">
        {t("changelog")}
      </Link>

      <Link href="/privacy" className="hover:text-foreground transition-colors">
        {t("privacy")}
      </Link>

      <Link href="/tos" className="hover:text-foreground transition-colors">
        {t("tos")}
      </Link>
    </div>
  );
};